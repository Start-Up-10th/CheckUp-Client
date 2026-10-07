import { fireEvent, render, screen } from "@testing-library/react";
import { takeLoginApp } from "@/lib/auth/login-app";
import { StudentLogin } from "./StudentLogin";

describe("StudentLogin", () => {
  it("실패가 없으면 오류 배너를 그리지 않는다", () => {
    render(<StudentLogin />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("받은 실패 문구를 그대로 보여 준다", () => {
    render(<StudentLogin failureMessage="이용 권한이 없는 계정입니다." />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "이용 권한이 없는 계정입니다.",
    );
  });

  it("로그인을 시작하기 직전에 사용자 앱에서 시작했다고 적는다", () => {
    const originalLocation = window.location;
    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { assign },
    });
    window.localStorage.setItem(
      "checkup:login-app",
      JSON.stringify({ app: "admin", at: Date.now() }),
    );
    try {
      render(<StudentLogin />);

      fireEvent.click(
        screen.getByRole("button", { name: /DataGSM으로 계속하기/ }),
      );

      expect(assign).toHaveBeenCalledWith("/api/v1/auth/login");
      // 이전에 남은 관리자 기록을 사용자 앱 기록으로 덮어쓴다.
      expect(takeLoginApp()).toBe("user");
    } finally {
      Object.defineProperty(window, "location", {
        configurable: true,
        value: originalLocation,
      });
      window.localStorage.clear();
    }
  });
});
