"use client";

import { useSyncExternalStore } from "react";

/** Tailwind `md`(768px)와 같은 경계. 학생 화면은 이 폭부터 노트북 디자인이다. */
const LAPTOP_QUERY = "(min-width: 768px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(LAPTOP_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * 지금 화면이 노트북 폭인지. 서버 렌더링 때는 알 수 없어 `null`을 돌려준다 —
 * 얼굴 등록처럼 "노트북이면 카메라를 켜지 않는다"(REQ-FACE-001)는 판단은 null이 아닐 때만 한다.
 */
export function useIsLaptop(): boolean | null {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(LAPTOP_QUERY).matches,
    () => null,
  );
}
