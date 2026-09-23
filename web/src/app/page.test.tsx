import { render, screen } from "@testing-library/react";
import RootPage from "./page";

describe("RootPage", () => {
  it("로그인 미구현 안내와 관리자 홈 진입 링크를 보여준다", () => {
    render(<RootPage />);
    expect(
      screen.getByText("개발용 진입 화면 (로그인 미구현)"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "관리자 홈으로 이동" }),
    ).toHaveAttribute("href", "/admin");
  });
});
