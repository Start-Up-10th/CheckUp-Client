"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusBanner } from "@/components/admin/StatusBanner";

const TOAST_DURATION_MS = 2500;

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
    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = useCallback(
    (next: ToastMessage) => setToast({ id: Date.now(), ...next }),
    [],
  );

  return { toast, showToast };
}

/**
 * 위치 규칙(디자이너 결정):
 * - 폰(<md): 탭바(60px) 바로 위 18px = bottom-[78px], 좌우 18px 여백으로 화면 폭 채움 (Figma 783:218)
 * - 패드(md): 콘텐츠 영역(레일 96px 오른쪽) 상단 28px · 우측 24px, 최대 360px (Figma 783:1221)
 * - 컴퓨터(xl): 하단 28px, 사이드바(300px) 오른쪽 콘텐츠 영역 중앙, 최대 500px
 * 모달(z-40) 위에 표시되도록 z-50 유지.
 * 전체화면 카메라(얼굴 인식 전체화면) 중 토스트는 Fullscreen API 제약으로 별도 처리가 필요하며 현재 미구현.
 */
export function ToastLayer({ toast }: { toast: ToastMessage | null }) {
  if (!toast) return null;
  return (
    <div
      className="pointer-events-none fixed z-50 flex justify-center
        bottom-[78px] inset-x-[18px]
        md:inset-x-0 md:top-7 md:bottom-auto md:left-[96px] md:justify-end md:pr-6
        xl:top-auto xl:bottom-7 xl:left-[300px] xl:justify-center xl:pr-0"
    >
      <div className="pointer-events-auto w-full md:max-w-[360px] xl:max-w-[500px]">
        <StatusBanner variant={toast.variant} message={toast.message} />
      </div>
    </div>
  );
}
