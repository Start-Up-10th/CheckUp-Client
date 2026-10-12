"use client";

import { ModeToggle, MoonIcon } from "@/components/ModeToggle";
import { useTheme } from "@/lib/theme";

type AdminThemeToggleProps = {
  /** 놓이는 자리: 컴퓨터 사이드바(sidebar) · 패드 레일(rail) · 핸드폰 메뉴 시트(sheet). */
  placement: "sidebar" | "rail" | "sheet";
};

const BUTTON_CLASS: Record<AdminThemeToggleProps["placement"], string> = {
  sidebar:
    "mb-2 flex h-[42px] items-center gap-2.5 rounded-control px-3.5 text-sm text-admin-textSecondary transition-colors hover:bg-admin-bg",
  rail: "mb-2.5 flex w-full flex-col items-center gap-1.5 rounded-[14px] py-[11px] text-admin-textFaint transition-colors hover:bg-admin-bg",
  sheet:
    "flex items-center gap-3.5 rounded-xl px-3.5 py-[13px] text-left text-[15px] font-medium leading-[18px] text-admin-ghost-text transition-colors hover:bg-admin-bg",
};

/**
 * 관리자 화면의 화면 모드 전환(REQ-UI-008). Figma에는 학생 마이페이지에만 있어, 관리자 쪽 자리는 작업자가 정했다
 * (DEC-074): 세 폭 모두 로그아웃 바로 위. 토글 그림과 `화면 모드` 문구는 학생 것(Figma ModeToggle)을 그대로 쓴다.
 * 레일은 폭이 좁아 토글과 짧은 글자 `화면`만 둔다.
 */
export function AdminThemeToggle({ placement }: AdminThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={theme === "dark"}
      aria-label="다크 모드"
      onClick={toggleTheme}
      className={BUTTON_CLASS[placement]}
    >
      {placement === "rail" ? (
        <>
          <ModeToggle />
          <span className="text-[10px] leading-3">화면</span>
        </>
      ) : (
        <>
          <span
            className={
              placement === "sheet"
                ? "flex size-5 shrink-0 items-center justify-center text-admin-textMuted"
                : "flex shrink-0"
            }
          >
            <MoonIcon
              className={placement === "sheet" ? "size-5" : "size-[18px]"}
            />
          </span>
          <span className="flex-1 text-left">화면 모드</span>
          <ModeToggle />
        </>
      )}
    </button>
  );
}
