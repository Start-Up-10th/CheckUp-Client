import { fireEvent, render, screen } from "@testing-library/react";
import AdminUnauthorizedPage from "./page";

const logout = vi.hoisted(() => vi.fn());
vi.mock("@/lib/admin/use-admin-logout", () => ({
  useAdminLogout: () => logout,
}));

describe("관리자 권한 부족 화면", () => {
  it("명세 문구로 권한이 없는 계정임을 알려 준다", () => {
    render(<AdminUnauthorizedPage />);

    expect(
      screen.getByText("관리자 권한이 없는 계정입니다."),
    ).toBeInTheDocument();
  });

  it("로그인 페이지로 돌아가기를 누르면 로그아웃한다", () => {
    render(<AdminUnauthorizedPage />);

    fireEvent.click(
      screen.getByRole("button", { name: "로그인 페이지로 돌아가기" }),
    );

    expect(logout).toHaveBeenCalledTimes(1);
  });
});
