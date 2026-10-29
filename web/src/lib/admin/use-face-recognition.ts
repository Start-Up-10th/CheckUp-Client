"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { redirectToAdminLogin } from "@/lib/admin/admin-session";
import { captureFrame } from "@/lib/admin/capture-frame";
import { FaceApiError } from "@/lib/admin/face-api";
import { useFaceGateway } from "@/lib/admin/face-gateway";
import {
  addRecent,
  newEntries,
  applyFrame,
  INITIAL_RECOGNITION,
  msUntilNextReset,
  type RecentEntry,
} from "@/lib/admin/face-results";
import type { Floor } from "@/lib/admin/floor-types";
import type { Purpose } from "@/lib/admin/purpose";
import { AdminUnauthorizedError } from "@/lib/admin/qr-api";
import { RateLimitedError } from "@/lib/rate-limit";

/** 프레임 전송을 시작한 시각부터 다음 프레임을 보내기까지의 간격. 서버 최소 간격은 1ms로 완화됐지만(CheckUp-server#266) 서버·기기 부하와 실패 누적 속도를 고려해 유지한다. */
export const FRAME_INTERVAL_MS = 250;
/** 그 밖의 실패 뒤 다시 보내기까지 기다리는 시간. */
export const ERROR_BACKOFF_MS = 2000;
/** 연속 실패가 이만큼 쌓이면 오류 상태로 알린다. */
export const MAX_CONSECUTIVE_FAILURES = 5;
/** QR 안내를 유지하는 시간. 얼굴이 잠깐 사라져도 깜빡이지 않게 한다. */
export const QR_NOTICE_HOLD_MS = 8000;

/** 서버가 프레임 요청에서 세션이 없거나 종료됐다고 알리는 오류 코드. */
const SESSION_GONE_CODE = "FACE_SESSION_NOT_FOUND";

export type FaceSessionStatus = "starting" | "running" | "error";

// shortcut: 서버 오류를 화면에서 확인하려는 임시 진단 로그다. 서버 쪽 오류 기록이 생기면 없앤다.
/** 진단 로그 최대 개수. 넘으면 오래된 것부터 지운다. */
export const MAX_DIAGNOSTIC_LOGS = 20;
/** 이보다 오래 걸린 프레임 응답은 느린 응답으로 남긴다. 느린 응답이 이어지면 처음 한 번만 남겨 앞선 오류를 밀어내지 않는다. */
export const SLOW_RESPONSE_MS = 1000;

/** 진단 로그 한 줄. 신원·프레임은 담지 않고 시각과 오류 요약만 둔다. */
export type DiagnosticLog = { id: string; time: string; message: string };

function describeError(error: unknown): string {
  if (error instanceof FaceApiError)
    return `${error.status} ${error.code ?? "코드 없음"}`;
  if (error instanceof Error) return error.message;
  return String(error);
}

type Options = {
  videoRef: RefObject<HTMLVideoElement | null>;
  /** 카메라 허용을 받은 뒤에만 세션을 만든다. 허용 전에는 프레임을 보내지 않는다(REQ-FACE-004). */
  cameraReady: boolean;
  purpose: Purpose;
  /** 이 카메라가 맡은 층. 바뀌면 세션을 새로 만든다(카메라는 그대로, DEC-100). */
  floor: Floor;
  /** 프레임을 뜨는 함수. 기본은 video를 가로 640px JPEG로 뜬다. 테스트가 바꾸며, 바뀌면 세션을 새로 만드니 안정된 함수를 넘긴다. */
  capture?: (video: HTMLVideoElement) => Promise<Blob | null>;
  intervalMs?: number;
};

/**
 * REQ-FACE-004·006·007: 관리자 카메라 얼굴 인식. 카메라가 준비되면 서버에 세션을 만들고, 응답이 올 때마다
 * 프레임을 한 장씩(겹치지 않게) 보낸 뒤 결과를 최근 인식 목록과 QR 안내로 알린다(DEC-108). 화면을
 * 떠나면 그 세션만 종료하고 카메라 자체는 건드리지 않는다. 프레임은 저장하지 않는다.
 */
export function useFaceRecognition({
  videoRef,
  cameraReady,
  purpose,
  floor,
  capture,
  intervalMs = FRAME_INTERVAL_MS,
}: Options) {
  const gateway = useFaceGateway();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<FaceSessionStatus>("starting");
  const [qrNotice, setQrNotice] = useState(false);
  // 최근 인식 목록(최대 30개, DEC-108). 화면 메모리에만 두고, 층·용도를 바꾸면 비운다.
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  // 서버가 요청이 너무 많다고(429) 한 동안 true다. 다음 프레임 응답이 오면 false로 돌아온다.
  const [rateLimited, setRateLimited] = useState(false);
  // 최근 것이 위. 세션을 새로 만들어도 남겨 실패 원인을 이어 볼 수 있게 한다.
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  // 매일 08:00에 목록을 비운다(당일 기록 폐기, DEC-108). 새 결과가 없어도 어제 이름이 남지 않게 한다.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function schedule() {
      timer = setTimeout(() => {
        setRecent([]);
        schedule();
      }, msUntilNextReset(new Date()));
    }
    schedule();
    return () => clearTimeout(timer);
  }, []);

  // 층·용도를 바꾸면 다른 세션의 목록이므로 비운다. 카메라 끊김·재시도로 세션을 새로 만들 때는 남긴다(DEC-108).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setRecent([]), [floor, purpose]);

  useEffect(() => {
    if (!cameraReady) return;
    let cancelled = false;
    let sessionId: string | null = null;
    let closedSessionId: string | null = null;
    let state = INITIAL_RECOGNITION;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let qrTimer: ReturnType<typeof setTimeout> | undefined;

    function sleep(ms: number): Promise<void> {
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          timers.delete(timer);
          resolve();
        }, ms);
        timers.add(timer);
      });
    }

    function hold(
      show: () => void,
      hide: () => void,
      ms: number,
      previous: ReturnType<typeof setTimeout> | undefined,
    ) {
      clearTimeout(previous);
      show();
      return setTimeout(hide, ms);
    }

    const takeFrame =
      capture ??
      ((video: HTMLVideoElement) => {
        canvasRef.current ??= document.createElement("canvas");
        return captureFrame(video, canvasRef.current);
      });

    function log(message: string) {
      const time = new Date().toTimeString().slice(0, 8);
      const entry = { id: crypto.randomUUID(), time, message };
      setLogs((list) => [entry, ...list].slice(0, MAX_DIAGNOSTIC_LOGS));
    }

    function fail(error: unknown) {
      if (error instanceof AdminUnauthorizedError) {
        redirectToAdminLogin();
        return;
      }
      if (cancelled) return;
      log(`인식 중단: ${describeError(error)}`);
      setStatus("error");
    }

    async function run() {
      try {
        const id = await gateway.createSession(purpose, floor);
        if (cancelled) {
          gateway.closeSession(id);
          return;
        }
        sessionId = id;
      } catch (error) {
        fail(error);
        return;
      }
      setStatus("running");

      let failures = 0;
      let slow = false;
      while (!cancelled && sessionId) {
        const video = videoRef.current;
        const frame = video ? await takeFrame(video) : null;
        if (cancelled) break;
        let delay = intervalMs;
        if (frame) {
          const sentAt = Date.now();
          try {
            const result = await gateway.sendFrame(
              sessionId,
              frame,
              crypto.randomUUID(),
            );
            if (cancelled) break;
            failures = 0;
            const elapsed = Date.now() - sentAt;
            if (elapsed >= SLOW_RESPONSE_MS && !slow) {
              log(`느린 응답: ${elapsed}ms`);
            }
            slow = elapsed >= SLOW_RESPONSE_MS;
            // 응답이 오래 걸렸으면 그만큼 덜 쉰다. 간격은 전송 시작 시각부터 센다.
            delay = Math.max(0, intervalMs - (Date.now() - sentAt));
            setRateLimited(false);
            const now = new Date();
            const outcome = applyFrame(state, result.faces, now);
            state = outcome.state;
            const added = newEntries(outcome, now);
            setRecent((list) => addRecent(list, added));
            if (outcome.qrRecommended) {
              qrTimer = hold(
                () => setQrNotice(true),
                () => setQrNotice(false),
                QR_NOTICE_HOLD_MS,
                qrTimer,
              );
            }
          } catch (error) {
            if (cancelled) break;
            if (error instanceof AdminUnauthorizedError) {
              redirectToAdminLogin();
              return;
            }
            if (
              error instanceof FaceApiError &&
              error.code === SESSION_GONE_CODE
            ) {
              // 세션이 서버에서 사라졌다(유휴 정리 등). 새 세션을 만들어 이어 가되, 계속 사라지면 무한히 만들지
              // 않도록 실패로 세고 간격을 둔다. 라우트가 없는 404 등 다른 404는 이 경우가 아니다.
              failures += 1;
              log(
                `세션 사라짐(${SESSION_GONE_CODE}), 새 세션을 만듦 (연속 ${failures}회)`,
              );
              if (failures >= MAX_CONSECUTIVE_FAILURES) {
                fail(error);
                return;
              }
              let recreated: string;
              try {
                recreated = await gateway.createSession(purpose, floor);
              } catch (recreateError) {
                fail(recreateError);
                return;
              }
              if (cancelled) {
                gateway.closeSession(recreated);
                return;
              }
              sessionId = recreated;
              // 새 세션은 얼굴 트랙도 새로 시작하므로 이전 세션의 트랙 기록은 버린다.
              state = { ...state, tracks: {} };
              await sleep(intervalMs);
              continue;
            }
            if (error instanceof RateLimitedError) {
              // 요청이 너무 많다는 안내(429)는 실패로 세지 않고 서버가 알려 준 시간(Retry-After, 없으면 1초)만큼 기다린다.
              setRateLimited(true);
              delay = error.retryAfterMs;
              log(`429 요청이 너무 많음, ${delay}ms 뒤 다시 보냄`);
            } else {
              failures += 1;
              log(
                `프레임 실패: ${describeError(error)} (${Date.now() - sentAt}ms, 연속 ${failures}회)`,
              );
              if (failures >= MAX_CONSECUTIVE_FAILURES) {
                fail(error);
                return;
              }
              delay = ERROR_BACKOFF_MS;
            }
          }
        }
        await sleep(delay);
      }
    }

    // 재시도마다 새 세션이므로 이전 세션의 상태를 비운다. 최근 인식 목록은 층·용도가 바뀔 때만 비운다(DEC-108).
    /* eslint-disable react-hooks/set-state-in-effect */
    setStatus("starting");
    setQrNotice(false);
    setRateLimited(false);
    /* eslint-enable react-hooks/set-state-in-effect */
    void run();

    // 탭을 닫거나 새로고침·이동하면 React 정리 함수가 실행되지 않을 수 있어, 페이지를 떠날 때도 현재 세션을
    // 종료한다(REQ-FACE-004). 같은 세션을 두 번 종료하지 않는다. 뒤로 가기 캐시에서 되살아나 종료된 세션으로
    // 프레임을 보내면 서버가 세션 없음을 알려 새 세션으로 이어 간다.
    function closeCurrentSession() {
      if (!sessionId || closedSessionId === sessionId) return;
      closedSessionId = sessionId;
      gateway.closeSession(sessionId);
    }
    window.addEventListener("pagehide", closeCurrentSession);

    return () => {
      cancelled = true;
      window.removeEventListener("pagehide", closeCurrentSession);
      timers.forEach(clearTimeout);
      clearTimeout(qrTimer);
      closeCurrentSession();
    };
  }, [
    cameraReady,
    purpose,
    floor,
    gateway,
    attempt,
    capture,
    intervalMs,
    videoRef,
  ]);

  return {
    status,
    qrNotice,
    recent,
    rateLimited,
    logs,
    retry,
  };
}
