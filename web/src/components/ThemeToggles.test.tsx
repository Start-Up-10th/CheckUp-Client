import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { AdminThemeToggle } from "@/components/admin/AdminThemeToggle";
import { ThemeMenuRow } from "@/components/student/ThemeMenuRow";
import { THEME_STORAGE_KEY } from "@/lib/theme";

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe("화면 모드 전환(REQ-UI-008)", () => {
  it("학생 마이페이지 `화면 모드` 줄의 토글을 누르면 다크 모드가 켜지고 다시 누르면 꺼진다", async () => {
    const user = userEvent.setup();
    render(<ThemeMenuRow />);
    expect(screen.getByText("화면 모드")).toBeInTheDocument();
    const toggle = screen.getByRole("switch", { name: "다크 모드" });
    expect(toggle).toHaveAttribute("aria-checked", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it.each(["sidebar", "rail", "sheet"] as const)(
    "관리자 %s 자리의 버튼도 같은 모드를 바꾼다",
    async (placement) => {
      const user = userEvent.setup();
      render(<AdminThemeToggle placement={placement} />);
      const toggle = screen.getByRole("switch", { name: "다크 모드" });

      await user.click(toggle);
      expect(toggle).toHaveAttribute("aria-checked", "true");
      expect(document.documentElement.dataset.theme).toBe("dark");
    },
  );

  it("이미 다크 모드면 켜진 상태로 보인다", () => {
    document.documentElement.dataset.theme = "dark";
    render(<ThemeMenuRow />);
    expect(screen.getByRole("switch", { name: "다크 모드" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});
