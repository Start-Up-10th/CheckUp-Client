"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusBanner } from "@/components/admin/StatusBanner";

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

/**
 * 위치 규칙(사용자 결정 2026-10-07, 핸드폰·패드·컴퓨터 공통): 화면 위쪽 가운데에 뜬다.
 * - 폭: 핸드폰(<md)은 좌우 18px을 뺀 전체 폭이되 354px을 넘지 않고, 패드(md)는 320, 컴퓨터(xl)는 400이다.
 * - 위: 핸드폰 12px, 패드 20px, 컴퓨터 24px. 노치·상태바가 있는 기기는 `env(safe-area-inset-top)`만큼 더 내린다.
 * - 문구가 길면 줄 바꿈하고(폭은 그대로), 토스트 바깥은 `pointer-events-none`이라 아래 화면 조작을 막지 않는다.
 * - 알림 역할은 StatusBanner가 가진다(오류 `alert`, 그 밖 `status`). 모달(z-40) 위에 표시되도록 z-50이다.
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
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-[18px] top-[calc(env(safe-area-inset-top)+12px)] z-50 flex justify-center md:top-[calc(env(safe-area-inset-top)+20px)] xl:top-[calc(env(safe-area-inset-top)+24px)]">
      <div className="pointer-events-auto w-full max-w-[354px] md:w-[320px] md:max-w-none xl:w-[400px]">
        <StatusBanner
          variant={toast.variant}
          message={toast.message}
          compactOnPhone={compactOnPhone}
        />
      </div>
    </div>
  );
}
