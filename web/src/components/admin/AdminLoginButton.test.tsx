import { fireEvent, render, screen } from "@testing-library/react";
import { takeLoginApp } from "@/lib/auth/login-app";
import { AdminLoginButton } from "./AdminLoginButton";

afterEach(() => window.localStorage.clear());

describe("AdminLoginButton", () => {
  it("서버 로그인 시작 주소로 연결된다", () => {
    render(<AdminLoginButton />);

    expect(
      screen.getByRole("link", { name: /DataGSM으로 계속하기/ }),
    ).toHaveAttribute("href", "/api/v1/auth/login");
  });

  it("누르면 관리자 앱에서 시작했다고 적는다", () => {
    render(<AdminLoginButton />);

    // 링크 이동 자체는 jsdom이 하지 않는다. 클릭 처리만 확인한다.
    fireEvent.click(screen.getByRole("link", { name: /DataGSM으로 계속하기/ }));

    expect(takeLoginApp()).toBe("admin");
  });
});
