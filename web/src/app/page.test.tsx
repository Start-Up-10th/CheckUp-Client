import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home", () => {
  it("서비스 제목을 보여준다", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { name: "기숙사 출석 관리" }),
    ).toBeInTheDocument();
  });
});
