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
import { applyFrame, INITIAL_RECOGNITION } from "@/lib/admin/face-results";
import type { RecognitionEntry } from "@/lib/admin/face-results";
import type { Purpose } from "@/lib/admin/purpose";
import { AdminUnauthorizedError } from "@/lib/admin/qr-api";

/** 응답이 온 뒤 다음 프레임을 보내기까지의 간격. 서버 최소 간격(200ms)보다 넉넉히 둔다. */
export const FRAME_INTERVAL_MS = 500;
/** 서버가 요청이 너무 빠르다고(429) 했을 때 기다리는 시간. */
export const RATE_LIMIT_BACKOFF_MS = 1000;
/** 그 밖의 실패 뒤 다시 보내기까지 기다리는 시간. */
export const ERROR_BACKOFF_MS = 2000;
/** 연속 실패가 이만큼 쌓이면 오류 상태로 알린다. */
export const MAX_CONSECUTIVE_FAILURES = 5;
/** QR 안내·성공 표시를 유지하는 시간. 얼굴이 잠깐 사라져도 깜빡이지 않게 한다. */
export const QR_NOTICE_HOLD_MS = 8000;
export const SUCCESS_HOLD_MS = 3000;
export const FAILURE_HOLD_MS = 3000;

/** 서버가 프레임 요청에서 세션이 없거나 종료됐다고 알리는 오류 코드. */
const SESSION_GONE_CODE = "FACE_SESSION_NOT_FOUND";

export type FaceSessionStatus = "starting" | "running" | "error";

type Options = {
  videoRef: RefObject<HTMLVideoElement | null>;
  /** 카메라 허용을 받은 뒤에만 세션을 만든다. 허용 전에는 프레임을 보내지 않는다(REQ-FACE-004). */
  cameraReady: boolean;
  purpose: Purpose;
  /** 프레임을 뜨는 함수. 기본은 video를 가로 640px JPEG로 뜬다. 테스트가 바꾸며, 바뀌면 세션을 새로 만드니 안정된 함수를 넘긴다. */
  capture?: (video: HTMLVideoElement) => Promise<Blob | null>;
  intervalMs?: number;
};

/**
 * REQ-FACE-004·006·007: 관리자 카메라 얼굴 인식. 카메라가 준비되면 서버에 세션을 만들고, 응답이 올 때마다
 * 프레임을 한 장씩(겹치지 않게) 보낸 뒤 결과를 최근 인식 목록으로 만든다. 용도 탭을 바꾸거나 화면을 떠나면
 * 그 세션만 종료하고 카메라 자체는 건드리지 않는다. 프레임은 저장하지 않는다.
 */
export function useFaceRecognition({
  videoRef,
  cameraReady,
  purpose,
  capture,
  intervalMs = FRAME_INTERVAL_MS,
}: Options) {
  const gateway = useFaceGateway();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [entries, setEntries] = useState<RecognitionEntry[]>([]);
  const [status, setStatus] = useState<FaceSessionStatus>("starting");
  const [qrNotice, setQrNotice] = useState(false);
  const [success, setSuccess] = useState<RecognitionEntry | null>(null);
  const [failure, setFailure] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  useEffect(() => {
    if (!cameraReady) return;
    let cancelled = false;
    let sessionId: string | null = null;
    let closedSessionId: string | null = null;
    let state = INITIAL_RECOGNITION;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    let qrTimer: ReturnType<typeof setTimeout> | undefined;
    let successTimer: ReturnType<typeof setTimeout> | undefined;
    let failureTimer: ReturnType<typeof setTimeout> | undefined;

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

    let qrActive = false;
    let failurePending = false;
    function showFailure() {
      failurePending = false;
      failureTimer = hold(
        () => setFailure(true),
        () => setFailure(false),
        FAILURE_HOLD_MS,
        failureTimer,
      );
    }

    const takeFrame =
      capture ??
      ((video: HTMLVideoElement) => {
        canvasRef.current ??= document.createElement("canvas");
        return captureFrame(video, canvasRef.current);
      });

    function fail(error: unknown) {
      if (error instanceof AdminUnauthorizedError) {
        redirectToAdminLogin();
        return;
      }
      if (!cancelled) setStatus("error");
    }

    async function run() {
      try {
        const id = await gateway.createSession(purpose);
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
      while (!cancelled && sessionId) {
        const video = videoRef.current;
        const frame = video ? await takeFrame(video) : null;
        if (cancelled) break;
        let delay = intervalMs;
        if (frame) {
          try {
            const result = await gateway.sendFrame(
              sessionId,
              frame,
              crypto.randomUUID(),
            );
            if (cancelled) break;
            failures = 0;
            const outcome = applyFrame(state, result.faces, new Date());
            state = outcome.state;
            setEntries(state.entries);
            const found = outcome.success;
            if (found) {
              successTimer = hold(
                () => setSuccess(found),
                () => setSuccess(null),
                SUCCESS_HOLD_MS,
                successTimer,
              );
            }
            if (outcome.qrRecommended) {
              qrActive = true;
              qrTimer = hold(
                () => setQrNotice(true),
                () => {
                  qrActive = false;
                  setQrNotice(false);
                  // QR 안내에 밀려 기다리던 인식 실패 표시를 이어서 보인다.
                  if (failurePending) showFailure();
                },
                QR_NOTICE_HOLD_MS,
                qrTimer,
              );
            }
            if (outcome.failure) {
              // QR 안내가 떠 있으면 같은 자리를 쓰므로 안내가 끝난 뒤에 보인다.
              if (qrActive) failurePending = true;
              else showFailure();
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
              if (failures >= MAX_CONSECUTIVE_FAILURES) {
                fail(error);
                return;
              }
              let recreated: string;
              try {
                recreated = await gateway.createSession(purpose);
              } catch (recreateError) {
                fail(recreateError);
                return;
              }
              if (cancelled) {
                gateway.closeSession(recreated);
                return;
              }
              sessionId = recreated;
              // 새 세션은 얼굴 트랙도 새로 시작하므로 이전 세션의 트랙 시도 기록은 버린다.
              state = { ...state, tracks: {} };
              await sleep(intervalMs);
              continue;
            }
            failures += 1;
            if (failures >= MAX_CONSECUTIVE_FAILURES) {
              fail(error);
              return;
            }
            delay =
              error instanceof FaceApiError && error.status === 429
                ? RATE_LIMIT_BACKOFF_MS
                : ERROR_BACKOFF_MS;
          }
        }
        await sleep(delay);
      }
    }

    // 용도 탭 변경·재시도마다 새 세션이므로 이전 세션의 기록과 상태를 비운다.
    /* eslint-disable react-hooks/set-state-in-effect */
    setEntries([]);
    setStatus("starting");
    setQrNotice(false);
    setSuccess(null);
    setFailure(false);
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
      clearTimeout(successTimer);
      clearTimeout(failureTimer);
      closeCurrentSession();
    };
  }, [cameraReady, purpose, gateway, attempt, capture, intervalMs, videoRef]);

  return { entries, status, qrNotice, success, failure, retry };
}
