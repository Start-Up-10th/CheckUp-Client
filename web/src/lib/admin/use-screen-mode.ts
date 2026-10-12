"use client";

import { useCallback, useEffect, useState } from "react";

export type ScreenMode = "light" | "dark";

const STORAGE_KEY = "checkup-admin-screen-mode";

function readStoredMode(): ScreenMode {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "dark"
      ? "dark"
      : "light";
  } catch {
    // 저장소를 못 쓰는 환경(사생활 보호 모드 등)에서는 라이트로 둔다.
    return "light";
  }
}

function applyMode(mode: ScreenMode) {
  document.documentElement.dataset.theme = mode;
}

/**
 * 관리자 `화면 모드`(마이페이지, Figma ModeToggle Light/Dark). 선택은 이 브라우저에만 저장하고 `<html data-theme>`로
 * 알린다. 다크 색상 디자인이 정해지기 전이라 색 토큰은 아직 바뀌지 않는다.
 * 첫 렌더는 서버와 같게 라이트로 그리고, 마운트 뒤에 저장된 값을 읽는다.
 */
export function useScreenMode() {
  const [mode, setMode] = useState<ScreenMode>("light");

  useEffect(() => {
    const stored = readStoredMode();
    setMode(stored);
    applyMode(stored);
  }, []);

  const changeMode = useCallback((next: ScreenMode) => {
    setMode(next);
    applyMode(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // 저장 실패는 이번 방문에서만 적용되고 넘어간다.
    }
  }, []);

  return { mode, changeMode };
}
