import { render, screen } from "@testing-library/react";
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
});
