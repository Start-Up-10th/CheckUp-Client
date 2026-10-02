"use client";

import { useEffect, useRef, useState } from "react";
import { PurposeTabs } from "@/components/admin/PurposeTabs";
import { QrCodeGenerationPanel } from "@/components/admin/QrCodeGenerationPanel";
import { QrCodeGenerationSkeleton } from "@/components/admin/QrCodeGenerationSkeleton";
import { StatusBanner } from "@/components/admin/StatusBanner";
import { formatCountdown, type QrPurpose } from "@/lib/admin/mock-qr-session";
import { redirectToAdminLogin } from "@/lib/admin/admin-session";
import {
  createQrSession,
  heartbeatQrSession,
  closeQrSession,
  AdminUnauthorizedError,
  QrSessionNotFoundError,
} from "@/lib/admin/qr-api";

const DEFAULT_PURPOSE: QrPurpose = "dorm";
const HEARTBEAT_INTERVAL_MS = 20_000;

type ActiveSession = {
  sessionId: string;
  qrUrl: string;
  tokenExpiresAt: number;
  serverTimeOffset: number; // serverTime - clientTime at issuance
};

/**
 * REQ-ATT-003: 페이지 진입/목적 전환마다 새 QR 세션을 즉시 발급한다. 생성/종료 버튼은 없다.
 * REQ-ATT-004: heartbeat(~20s)로 qrUrl을 교체하고 "남은 유효 시간" mm:ss를 보여준다.
 *
 * serverTimeOffset으로 브라우저 시계 오차를 보정해 tokenExpiresAt 기준 카운트다운을 계산한다.
 * 목적 전환·페이지 이탈 시 sendBeacon으로 해당 세션만 종료한다(다른 탭·관리자 세션 영향 없음).
 */
export function AdminQrGeneration() {
  const [purpose, setPurpose] = useState<QrPurpose>(DEFAULT_PURPOSE);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // sessionKey를 올려 heartbeat 404 시 세션 재생성을 트리거한다.
  const [sessionKey, setSessionKey] = useState(0);

  const sessionIdRef = useRef<string | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // ref로 즉시 취소: handleSelectPurpose에서 React 스케줄러 전에 동기적으로 세트한다.
  const cancelRef = useRef(false);

  function handleSelectPurpose(nextPurpose: QrPurpose) {
    cancelRef.current = true;
    setPurpose(nextPurpose);
    setSession(null);
    setError(null);
  }

  useEffect(() => {
    cancelRef.current = false;

    function clearHeartbeat() {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    }

    async function startSession() {
      clearHeartbeat();
      try {
        const data = await createQrSession(purpose);
        if (cancelRef.current) {
          closeQrSession(data.sessionId);
          return;
        }
        sessionIdRef.current = data.sessionId;
        const offset = data.serverTime - Date.now();
        setSession({
          sessionId: data.sessionId,
          qrUrl: data.qrUrl,
          tokenExpiresAt: data.tokenExpiresAt,
          serverTimeOffset: offset,
        });
        setNow(Date.now());

        heartbeatRef.current = setInterval(async () => {
          const id = sessionIdRef.current;
          if (!id || cancelRef.current) return;
          try {
            const hb = await heartbeatQrSession(id);
            if (cancelRef.current) return;
            setSession((prev) =>
              prev
                ? {
                    ...prev,
                    qrUrl: hb.qrUrl,
                    tokenExpiresAt: hb.tokenExpiresAt,
                    serverTimeOffset: hb.serverTime - Date.now(),
                  }
                : null,
            );
          } catch (err) {
            if (cancelRef.current) return;
            if (err instanceof AdminUnauthorizedError) {
              // 관리자 세션이 끊기면 만료된 QR을 남기지 않고 로그인으로 보낸다.
              clearHeartbeat();
              sessionIdRef.current = null;
              setSession(null);
              redirectToAdminLogin();
            } else if (err instanceof QrSessionNotFoundError) {
              // 서버 세션이 사라진 경우 새 세션을 생성한다.
              sessionIdRef.current = null;
              setSession(null);
              setSessionKey((k) => k + 1);
            } else {
              // 일시적 네트워크·서버 오류: 만료된 QR을 유효한 것처럼 표시하지 않는다.
              setSession(null);
              setError("QR 갱신에 실패했습니다. 새로고침해 주세요.");
            }
          }
        }, HEARTBEAT_INTERVAL_MS);
      } catch (err) {
        if (cancelRef.current) return;
        if (err instanceof AdminUnauthorizedError) {
          redirectToAdminLogin();
        } else {
          setError("QR 자동 생성에 실패했습니다. 새로고침해 주세요.");
        }
      }
    }

    startSession();

    const tickTimer = setInterval(() => {
      if (!cancelRef.current) setNow(Date.now());
    }, 1000);

    return () => {
      cancelRef.current = true;
      clearInterval(tickTimer);
      clearHeartbeat();
      if (sessionIdRef.current) {
        closeQrSession(sessionIdRef.current);
        sessionIdRef.current = null;
      }
    };
  }, [purpose, sessionKey]);

  const countdownLabel = (() => {
    if (error || !session || now === null) return undefined;
    const remaining = session.tokenExpiresAt - (now + session.serverTimeOffset);
    // remaining <= 0이면 undefined를 반환해 만료된 QR을 화면에 남기지 않는다.
    if (remaining <= 0) return undefined;
    return formatCountdown(remaining);
  })();

  return (
    <div className="flex h-full w-full flex-col gap-3.5 px-4 py-3.5 md:gap-4 md:px-[22px] md:py-6">
      <div className="flex w-full items-center justify-between md:items-end">
        <div className="flex flex-col gap-1">
          <p className="hidden font-mono text-[10px] tracking-[1.8px] text-admin-textFaint md:block xl:text-[11px] xl:tracking-[1.98px]">
            QR ISSUE
          </p>
          <h1 className="text-[22px] font-bold leading-[26px] tracking-[-0.44px] text-admin-text md:text-[26px] md:leading-normal md:tracking-[-0.78px] xl:text-[30px] xl:tracking-[-0.9px]">
            QR 코드 생성
          </h1>
        </div>
        <PurposeTabs selected={purpose} onSelect={handleSelectPurpose} />
      </div>

      {error && <StatusBanner variant="error" message={error} compactOnPhone />}

      {session && countdownLabel ? (
        <QrCodeGenerationPanel
          qrValue={session.qrUrl}
          countdownLabel={countdownLabel}
        />
      ) : (
        <QrCodeGenerationSkeleton />
      )}
    </div>
  );
}
