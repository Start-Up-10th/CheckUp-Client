"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export type ScreenMode = "light" | "dark";

const STORAGE_KEY = "checkup-admin-screen-mode";

const listeners = new Set<() => void>();
// 저장소를 못 쓰는 환경(사생활 보호 모드 등)에서도 이번 방문에서는 바뀌도록 저장 실패 때만 메모리에 둔다.
let fallbackMode: ScreenMode | null = null;

function readMode(): ScreenMode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // 아래에서 메모리 값을 쓴다.
  }
  return fallbackMode ?? "light";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** 서버 렌더와 첫 하이드레이션은 항상 라이트다. */
function getServerMode(): ScreenMode {
  return "light";
}

/**
 * 관리자 `화면 모드`(마이페이지, Figma ModeToggle Light/Dark). 선택은 이 브라우저에만 저장하고 `<html data-theme>`로
 * 알린다. 다크 색상 디자인이 정해지기 전이라 색 토큰은 아직 바뀌지 않는다.
 */
export function useScreenMode() {
  const mode = useSyncExternalStore(subscribe, readMode, getServerMode);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  const changeMode = useCallback((next: ScreenMode) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      fallbackMode = next;
    }
    listeners.forEach((listener) => listener());
  }, []);

  return { mode, changeMode };
}
