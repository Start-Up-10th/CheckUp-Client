"use client";

import { useSyncExternalStore } from "react";

/**
 * 화면 모드(라이트·다크) 전환(REQ-UI-008, DEC-074·DEC-075). 학생·관리자 화면이 같은 모드를 쓴다.
 * 고른 모드는 이 기기 브라우저(localStorage)에만 저장한다. 서버에는 보내지 않는다. 고른 적이 없으면 기기 설정을 따른다.
 * 지금 모드는 <html data-theme>에 적혀 있고, globals.css의 색 변수와 Tailwind `dark:` 변형이 그 값을 본다.
 */
export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "checkup-theme";

const CHANGE_EVENT = "checkup-theme-change";
const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * 첫 화면을 그리기 전에 <head>에서 실행해 <html data-theme>을 붙인다. 하이드레이션을 기다리면 다크 모드 사용자가
 * 밝은 화면을 잠깐 보게 된다. 저장소를 못 쓰는 환경(사생활 보호 모드 등)에서는 조용히 라이트로 둔다.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark"){t=window.matchMedia("${DARK_QUERY}").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})()`;

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

function storedTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return typeof window.matchMedia === "function" &&
    window.matchMedia(DARK_QUERY).matches
    ? "dark"
    : "light";
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** 저장된 모드(없으면 기기 설정)를 다시 붙인다. 다른 탭에서 바뀌었거나 기기 설정이 바뀌었을 때 부른다. */
export function syncTheme() {
  apply(storedTheme() ?? systemTheme());
}

/** 모드를 바꾸고 이 기기에 저장한다. 저장에 실패해도 지금 화면은 바뀐다. */
export function setTheme(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // 저장소를 못 쓰면 이번 방문에만 적용된다.
  }
  apply(theme);
}

function subscribe(onChange: () => void) {
  // 다른 탭에서 바꿨거나, 고른 적 없이 기기 설정이 바뀌면 이 탭도 따라간다.
  function onStorage(event: StorageEvent) {
    if (event.key === null || event.key === THEME_STORAGE_KEY) syncTheme();
  }
  const media =
    typeof window.matchMedia === "function"
      ? window.matchMedia(DARK_QUERY)
      : null;

  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  media?.addEventListener("change", syncTheme);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
    media?.removeEventListener("change", syncTheme);
  };
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/** 서버에서는 모드를 알 수 없어 라이트로 그린다. 브라우저에서 실제 값으로 다시 맞춘다. */
function getServerSnapshot(): Theme {
  return "light";
}

/** 지금 모드와 바꾸는 함수. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    theme,
    toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
  };
}
