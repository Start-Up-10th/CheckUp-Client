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
 * 기본 위치 규칙(디자이너 결정):
 * - 폰(<md): 탭바(60px) 바로 위 18px = bottom-[78px], 좌우 18px 여백으로 화면 폭 채움 (Figma 783:218)
 * - 패드(md): 콘텐츠 영역(레일 96px 오른쪽) 상단 28px · 우측 24px, 최대 360px (Figma 783:1221)
 * - 컴퓨터(xl): 하단 28px, 사이드바(300px) 오른쪽 콘텐츠 영역 중앙, 최대 500px
 * `positionClassName`을 주면 위 위치 대신 쓴다(`fixed` 컨테이너의 위치 클래스만). 화면의 조작부(버튼·탭·검색)를
 * 가리지 않는 자리를 화면마다 정할 때 쓴다(봉사 화면, 측정으로 확인). `compactOnPhone`은 핸드폰 폭에서 크기를 줄이고 내용 길이만큼만 차지하며, 관리자 화면은 모두 기본으로
 * 켠다(관리자 핸드폰 상태 메시지 크기 통일, 사용자 결정 2026-10-02, Figma는 모든 폭이 같은 크기). 패드 이상은 Figma 크기
 * 그대로다. 모달(z-40) 위에 표시되도록 z-50 유지.
 * 전체화면 카메라(얼굴 인식 전체화면) 중 토스트는 Fullscreen API 제약으로 별도 처리가 필요하며 현재 미구현.
 */
const DEFAULT_POSITION = `justify-center bottom-[78px] inset-x-[18px]
  md:inset-x-0 md:top-7 md:bottom-auto md:left-[96px] md:justify-end md:pr-6
  xl:top-auto xl:bottom-7 xl:left-[300px] xl:justify-center xl:pr-0`;

export function ToastLayer({
  toast,
  positionClassName = DEFAULT_POSITION,
  compactOnPhone = true,
}: {
  toast: ToastMessage | null;
  positionClassName?: string;
  compactOnPhone?: boolean;
}) {
  if (!toast) return null;
  return (
    <div className={`pointer-events-none fixed z-50 flex ${positionClassName}`}>
      <div
        className={`pointer-events-auto md:max-w-[360px] xl:max-w-[500px] ${
          compactOnPhone ? "w-fit max-w-full md:w-full" : "w-full"
        }`}
      >
        <StatusBanner
          variant={toast.variant}
          message={toast.message}
          compactOnPhone={compactOnPhone}
        />
      </div>
    </div>
  );
}
