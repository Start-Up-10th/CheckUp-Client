import { fireEvent, render, screen } from "@testing-library/react";
import { takeLoginApp } from "@/lib/auth/login-app";
import { StudentLogin } from "./StudentLogin";

describe("StudentLogin", () => {
  it("로고·한 줄 소개·DataGSM 버튼이 카드에 있다", () => {
    render(<StudentLogin />);

    expect(screen.getByAltText("CHECKUP")).toBeInTheDocument();
    expect(screen.getByText("기숙사 입소를 편리하게")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /DataGSM으로 계속하기/ }),
    ).toBeInTheDocument();
  });

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
      value: { assign, href: "http://localhost/" },
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
