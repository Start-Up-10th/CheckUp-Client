import { render, screen } from "@testing-library/react";
import { AdminLoginButton } from "./AdminLoginButton";

describe("AdminLoginButton", () => {
  it("서버 로그인 시작 주소로 연결된다", () => {
    render(<AdminLoginButton />);

    expect(
      screen.getByRole("link", { name: /DataGSM으로 계속하기/ }),
    ).toHaveAttribute("href", "/api/v1/auth/login");
  });
});
