import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  THEME_INIT_SCRIPT,
  THEME_STORAGE_KEY,
  setTheme,
  syncTheme,
  useTheme,
} from "./theme";

function mockSystemDark(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}

function runInitScript() {
  new Function(THEME_INIT_SCRIPT)();
}

afterEach(() => {
  window.history.replaceState(null, "", "/");
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
  vi.unstubAllGlobals();
});

describe("첫 화면 모드 스크립트", () => {
  it("고른 적이 없으면 기기 설정을 따른다", () => {
    mockSystemDark(true);
    runInitScript();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("고른 모드가 기기 설정보다 먼저다", () => {
    mockSystemDark(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    runInitScript();
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("저장된 값이 이상하면 기기 설정을 따른다", () => {
    mockSystemDark(false);
    window.localStorage.setItem(THEME_STORAGE_KEY, "blue");
    runInitScript();
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});

describe("관리자 화면도 학생 화면과 같은 모드", () => {
  it("다크를 골랐으면 관리자 주소에서도 첫 화면이 다크다", () => {
    mockSystemDark(false);
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    window.history.replaceState(null, "", "/admin/students");
    runInitScript();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("고른 적이 없으면 관리자 화면도 기기 설정을 따른다", () => {
    mockSystemDark(true);
    window.history.replaceState(null, "", "/admin");
    runInitScript();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("학생 화면에서 고른 모드가 관리자 화면으로 옮겨도 그대로다", () => {
    mockSystemDark(false);
    setTheme("dark");
    window.history.replaceState(null, "", "/admin");
    syncTheme();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });
});

describe("useTheme", () => {
  it("바꾸면 <html>과 저장소에 남고 다시 바꾸면 돌아온다", () => {
    mockSystemDark(false);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("다른 곳에서 바꿔도 같은 화면의 훅이 따라간다", () => {
    mockSystemDark(false);
    const { result } = renderHook(() => useTheme());
    act(() => setTheme("dark"));
    expect(result.current.theme).toBe("dark");
  });
});
