"use client";

import { useEffect, useState } from "react";
import { PurposeTabs } from "@/components/admin/PurposeTabs";
import { QrCodeGenerationPanel } from "@/components/admin/QrCodeGenerationPanel";
import { QrCodeGenerationSkeleton } from "@/components/admin/QrCodeGenerationSkeleton";
import { StatusBanner } from "@/components/admin/StatusBanner";
import {
  createMockQrSession,
  formatCountdown,
  type QrPurpose,
  type QrSession,
} from "@/lib/admin/mock-qr-session";

const DEFAULT_PURPOSE: QrPurpose = "dorm";

/**
 * REQ-ATT-003: 페이지 진입/목적 전환마다 새 QR 세션을 즉시 발급한다. 생성/종료 버튼은 없다.
 * REQ-ATT-004: 15분마다 갱신하고 "남은 유효 시간" mm:ss를 보여준다.
 *
 * 세션 발급은 마운트 이후(useEffect)에만 한다. Math.random 기반 토큰을 초기 렌더에서
 * 바로 만들면 서버 렌더 결과와 클라이언트 첫 렌더가 달라져 hydration mismatch가 난다.
 * 실제 서버 연동 후에도 첫 발급은 비동기 응답을 기다려야 하므로, 이 로딩 상태는
 * REQ-UI-006의 스켈레톤 패턴과 자연히 맞아떨어진다.
 */
export function AdminQrGeneration() {
  const [purpose, setPurpose] = useState<QrPurpose>(DEFAULT_PURPOSE);
  const [session, setSession] = useState<QrSession | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [sessionError, setSessionError] = useState(false);

  function handleSelectPurpose(nextPurpose: QrPurpose) {
    setPurpose(nextPurpose);
    setSessionError(false);
    const fresh = createMockQrSession(nextPurpose);
    setSession(fresh);
    setNow(fresh.issuedAt);
  }

  useEffect(() => {
    const initial = createMockQrSession(DEFAULT_PURPOSE);
    // Math.random 기반 첫 세션은 마운트 후에만 만들 수 있다(hydration mismatch 방지 목적의
    // 의도된 초기화이며, 매 렌더마다 반복되는 파생 상태가 아니다).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(initial);
    setNow(initial.issuedAt);

    const interval = setInterval(() => {
      const tick = Date.now();
      setNow(tick);
      setSession((prev) => {
        if (!prev || tick < prev.expiresAt) return prev;
        // TODO(REQ-ATT-004): 실제 갱신 API 호출로 교체한다. 실패 시에만 setSessionError(true)로
        // "유효 시간이 만료되었습니다."를 보여주고, 갱신 재시도 전까지 만료된 토큰은 유효 처리하지 않는다.
        return createMockQrSession(prev.purpose, tick);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const countdownLabel =
    sessionError || !session || now === null
      ? undefined
      : formatCountdown(session.expiresAt - now);

  return (
    <div className="flex h-full w-full flex-col gap-3.5 px-4 py-3.5 md:gap-5 md:px-8 md:py-7">
      <div className="flex w-full items-center justify-between md:items-end">
        <div className="flex flex-col gap-1">
          <p className="hidden font-mono text-[11px] tracking-[1.98px] text-admin-textFaint md:block">
            QR ISSUE
          </p>
          <h1 className="text-[22px] font-bold leading-[26px] tracking-[-0.44px] text-admin-text md:text-[30px] md:leading-normal md:tracking-[-0.9px]">
            QR 코드 생성
          </h1>
        </div>
        <PurposeTabs selected={purpose} onSelect={handleSelectPurpose} />
      </div>

      {sessionError && (
        <StatusBanner
          variant="error"
          message="QR 자동 생성에 실패했습니다. 새로고침해 주세요."
        />
      )}

      {session && countdownLabel ? (
        <QrCodeGenerationPanel
          qrValue={session.token}
          countdownLabel={countdownLabel}
        />
      ) : (
        <QrCodeGenerationSkeleton />
      )}
    </div>
  );
}
