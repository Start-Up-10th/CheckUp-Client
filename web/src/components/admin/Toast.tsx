"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusBanner } from "@/components/admin/StatusBanner";
import { usePresence } from "@/hooks/use-presence";

/**
 * 노션 기능명세서 `로그인 성공 안내`(상태 메시지 표시 규격): 성공 메시지는 2초 뒤 자동으로 사라지고 오류 메시지는 4초 동안
 * 유지한다. 안내(neutral)는 명세에 없어 성공과 같이 2초다. 닫기 동작은 Figma에 없어 두지 않는다.
 */
const TOAST_DURATION_MS: Record<ToastMessage["variant"], number> = {
  success: 2000,
  neutral: 2000,
  error: 4000,
};

export type ToastMessage = {
  variant: "success" | "error" | "neutral";
  message: string;
};

/** 화면 하단에 잠깐 떴다 사라지는 상태 메시지(REQ-UI-006). 같은 문구를 다시 띄워도 타이머가 새로 시작된다. */
export function useToast() {
  const [toast, setToast] = useState<({ id: number } & ToastMessage) | null>(
    null,
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(
      () => setToast(null),
      TOAST_DURATION_MS[toast.variant],
    );
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = useCallback(
    (next: ToastMessage) => setToast({ id: Date.now(), ...next }),
    [],
  );

  return { toast, showToast };
}

/** 사라지는 애니메이션 시간. `tailwind.config.ts`의 `toast-out`(200ms)과 같다. */
export const TOAST_EXIT_MS = 200;

/**
 * 위치 규칙(사용자 결정 2026-10-07, 핸드폰·패드·컴퓨터 공통, 관리자·사용자 토스트 공통): 화면 위쪽 가운데에 뜬다.
 * - 위: 핸드폰 12px, 패드 20px, 컴퓨터 24px. 노치·상태바가 있는 기기는 `env(safe-area-inset-top)`만큼 더 내린다.
 * - 토스트 바깥은 `pointer-events-none`이라 아래 화면 조작을 막지 않는다. 모달(z-40) 위에 표시되도록 z-50이다.
 * - 애니메이션: 위에서 내려오며 나타나고(`toast-in`) 사라질 때는 위로 올라가며 흐려진다(`toast-out`). OS의 `동작 줄이기`를
 *   켠 사용자는 애니메이션 없이 보인다. `contentKey`가 바뀌면 다시 나타나는 애니메이션을 한다.
 * 폭은 `widthClassName`이 정한다(관리자 기본: 핸드폰 전체·최대 354, 패드 320, 컴퓨터 400).
 */
export function ToastFrame({
  closing,
  contentKey,
  widthClassName = "w-full max-w-[354px] md:w-[320px] md:max-w-none xl:w-[400px]",
  children,
}: {
  closing: boolean;
  contentKey: string;
  widthClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-[18px] top-[calc(env(safe-area-inset-top)+12px)] z-50 flex justify-center md:top-[calc(env(safe-area-inset-top)+20px)] xl:top-[calc(env(safe-area-inset-top)+24px)]">
      <div
        key={contentKey}
        className={`pointer-events-auto motion-reduce:animate-none ${closing ? "animate-toast-out" : "animate-toast-in"} ${widthClassName}`}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * 관리자 토스트. `toast`가 null이 돼도 사라지는 애니메이션이 끝날 때까지 마지막 토스트를 그린다.
 * `compactOnPhone`은 핸드폰 폭에서 글자·여백을 줄이고(관리자 핸드폰 상태 메시지 크기 통일, 사용자 결정 2026-10-02),
 * 패드 이상은 Figma 크기 그대로다.
 * 전체화면 카메라(얼굴 인식 전체화면) 중 토스트는 Fullscreen API 제약으로 별도 처리가 필요하며 현재 미구현.
 */
export function ToastLayer({
  toast,
  compactOnPhone = true,
}: {
  toast: ToastMessage | null;
  compactOnPhone?: boolean;
}) {
  const { current, closing } = usePresence(
    toast,
    TOAST_EXIT_MS,
    (a, b) => a.variant === b.variant && a.message === b.message,
  );
  if (!current) return null;
  return (
    <ToastFrame closing={closing} contentKey={current.message}>
      <StatusBanner
        variant={current.variant}
        message={current.message}
        compactOnPhone={compactOnPhone}
      />
    </ToastFrame>
  );
}
