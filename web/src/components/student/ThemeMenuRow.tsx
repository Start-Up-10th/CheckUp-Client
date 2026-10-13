"use client";

import { ModeToggle } from "@/components/ModeToggle";
import { useTheme } from "@/lib/theme";

/**
 * 마이페이지의 `화면 모드` 줄(REQ-UI-008, Figma 핸드폰 1278:42·노트북 1278:100). 높이 62px(안여백 18×17 + 토글 28),
 * 모서리 16px, 왼쪽 글자 15px, 오른쪽 토글. 누르는 곳은 Figma대로 토글이다.
 */
export function ThemeMenuRow() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex w-full items-center justify-between rounded-2xl bg-admin-surface px-[18px] py-[17px] text-[15px] leading-normal">
      <span className="text-admin-text">화면 모드</span>
      <button
        type="button"
        role="switch"
        aria-checked={theme === "dark"}
        aria-label="다크 모드"
        onClick={toggleTheme}
        className="shrink-0 rounded-full"
      >
        <ModeToggle />
      </button>
    </div>
  );
}
