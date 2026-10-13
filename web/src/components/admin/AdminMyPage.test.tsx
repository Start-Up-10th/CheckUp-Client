import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AdminMyPage } from "@/components/admin/AdminMyPage";

describe("AdminMyPage", () => {
  afterEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it("프로필과 얼굴 등록·화면 모드 메뉴를 보여 준다", () => {
    render(<AdminMyPage />);

    expect(screen.getByRole("heading", { name: "관리자" })).toBeInTheDocument();
    expect(screen.getByText("DataGSM 계정으로 로그인됨")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "화면 모드" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("얼굴 등록은 개인정보 동의 화면으로 간다", () => {
    render(<AdminMyPage />);

    expect(screen.getByRole("link", { name: /얼굴 등록/ })).toHaveAttribute(
      "href",
      "/consent",
    );
  });

  it("화면 모드를 바꾸면 저장하고 html에 알린다", () => {
    render(<AdminMyPage />);

    fireEvent.click(screen.getByRole("switch", { name: "화면 모드" }));

    expect(screen.getByRole("switch", { name: "화면 모드" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem("checkup-theme")).toBe("dark");
  });
});
