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
 * `placement="top-right"`는 컴퓨터(xl)에서만 오른쪽 위(상단 28px · 우측 32px, 화면 본문 여백과 같음)로 옮긴다.
 * `"below-tabs"`는 같은 오른쪽이되 헤더의 층 탭(하단 83px) 바로 아래 8px(91px)에 둬 탭을 가리지 않는다.
 * 폰·패드는 위 규칙을 그대로 따른다. `variantBorder`는 봉사 화면(Figma 06·07)의 종류별 테두리다.
 * 모달(z-40) 위에 표시되도록 z-50 유지.
 * 전체화면 카메라(얼굴 인식 전체화면) 중 토스트는 Fullscreen API 제약으로 별도 처리가 필요하며 현재 미구현.
 */
const DESKTOP_PLACEMENT = {
  default: "xl:top-auto xl:bottom-7 xl:left-[300px] xl:justify-center xl:pr-0",
  "top-right": "xl:top-7 xl:bottom-auto xl:left-[300px] xl:justify-end xl:pr-8",
  "below-tabs":
    "xl:top-[91px] xl:bottom-auto xl:left-[300px] xl:justify-end xl:pr-8",
} as const;

export function ToastLayer({
  toast,
  placement = "default",
  variantBorder = false,
}: {
  toast: ToastMessage | null;
  placement?: keyof typeof DESKTOP_PLACEMENT;
  variantBorder?: boolean;
}) {
  if (!toast) return null;
  return (
    <div
      className={`pointer-events-none fixed z-50 flex justify-center
        bottom-[78px] inset-x-[18px]
        md:inset-x-0 md:top-7 md:bottom-auto md:left-[96px] md:justify-end md:pr-6
        ${DESKTOP_PLACEMENT[placement]}`}
    >
      <div className="pointer-events-auto w-full md:max-w-[360px] xl:max-w-[500px]">
        <StatusBanner
          variant={toast.variant}
          message={toast.message}
          variantBorder={variantBorder}
        />
      </div>
    </div>
  );
}
