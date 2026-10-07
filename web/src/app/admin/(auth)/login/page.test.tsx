import { render, screen } from "@testing-library/react";
import AdminLoginPage from "./page";

vi.mock("@/components/admin/AdminLoginRedirect", () => ({
  AdminLoginRedirect: () => null,
}));

describe("관리자 로그인 화면", () => {
  it("로고·한 줄 소개·DataGSM 버튼이 한 카드에 있다", () => {
    render(<AdminLoginPage />);

    const card = screen.getByRole("main");
    expect(card).toHaveClass("bg-white", "w-[350px]", "h-[268px]");
    expect(screen.getByAltText("CHECKUP")).toBeInTheDocument();
    expect(screen.getByText("기숙사 입소를 편리하게")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /DataGSM으로 계속하기/ }),
    ).toHaveAttribute("href", "/api/v1/auth/login");
  });

  it("카드는 화면 한가운데에 있고 좁은 화면에서는 양옆 16px을 남긴다", () => {
    render(<AdminLoginPage />);

    expect(screen.getByRole("main")).toHaveClass(
      "left-1/2",
      "top-1/2",
      "-translate-x-1/2",
      "-translate-y-1/2",
      "max-w-[calc(100vw-32px)]",
    );
  });
});
