import { render, screen } from "@testing-library/react";
import AdminLoginPage from "./page";

vi.mock("@/components/admin/AdminLoginRedirect", () => ({
  AdminLoginRedirect: () => null,
}));

describe("관리자 로그인 화면", () => {
  it("로고·한 줄 소개·DataGSM 버튼이 한 카드에 있다", () => {
    const { container } = render(<AdminLoginPage />);

    expect(container.querySelector(".bg-white")).toHaveClass(
      "w-[350px]",
      "h-[268px]",
    );
    expect(screen.getByAltText("CHECKUP")).toBeInTheDocument();
    expect(screen.getByText("기숙사 입소를 편리하게")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /DataGSM으로 계속하기/ }),
    ).toHaveAttribute("href", "/api/v1/auth/login");
  });

  it("카드는 화면 가운데에 있다", () => {
    render(<AdminLoginPage />);

    expect(screen.getByRole("main")).toHaveClass(
      "items-center",
      "justify-center",
    );
  });
});
