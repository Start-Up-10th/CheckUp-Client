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
 * 위치 규칙(노션 기능명세서 `로그인 성공 안내`, 상태 메시지 위치와 폭):
 * - 핸드폰(<md): 하단 탭바(60px) 바로 위 18px = bottom-[78px], 좌우 18px 여백으로 폭 354.
 * - 패드(md): 레일(96px)을 뺀 콘텐츠 영역의 우측 상단(오른쪽 22px), 폭 360.
 * - 컴퓨터(xl): 사이드바(300px)를 뺀 콘텐츠 영역의 우측 상단(오른쪽 32px), 폭 400.
 * 패드·컴퓨터의 세로 위치(`topClassName`, 기본은 패드 87px·컴퓨터 99px = 층 탭 아래 16px)는 화면의 조작부(층 탭·검색창·
 * 버튼)를 가리지 않게 화면마다 정한다(예: 패드 07·08은 검색창이 전체 폭이라 검색창 아래).
 * `compactOnPhone`은 핸드폰 폭에서 글자·여백을 줄이고(관리자 핸드폰 상태 메시지 크기 통일, 사용자 결정 2026-10-02),
 * 패드 이상은 Figma 크기 그대로다. 모달(z-40) 위에 표시되도록 z-50을 유지한다.
 * 전체화면 카메라(얼굴 인식 전체화면) 중 토스트는 Fullscreen API 제약으로 별도 처리가 필요하며 현재 미구현.
 */
const BASE_POSITION = `justify-center bottom-[78px] inset-x-[18px]
  md:inset-x-auto md:bottom-auto md:left-[96px] md:right-[22px] md:justify-end
  xl:left-[300px] xl:right-8`;

export function ToastLayer({
  toast,
  topClassName = "md:top-[87px] xl:top-[99px]",
  compactOnPhone = true,
}: {
  toast: ToastMessage | null;
  /** 패드·컴퓨터에서 토스트의 위쪽 위치 클래스(`md:top-[…] xl:top-[…]`). */
  topClassName?: string;
  compactOnPhone?: boolean;
}) {
  if (!toast) return null;
  return (
    <div
      className={`pointer-events-none fixed z-50 flex ${BASE_POSITION} ${topClassName}`}
    >
      <div className="pointer-events-auto w-full md:w-[360px] xl:w-[400px]">
        <StatusBanner
          variant={toast.variant}
          message={toast.message}
          compactOnPhone={compactOnPhone}
        />
      </div>
    </div>
  );
}
