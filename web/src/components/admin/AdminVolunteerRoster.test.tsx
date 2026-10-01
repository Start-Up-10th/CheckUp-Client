import { fireEvent, render, screen, within } from "@testing-library/react";
import { resetRoster } from "@/lib/admin/volunteer-roster-store";
import { AdminVolunteerRoster } from "./AdminVolunteerRoster";

afterEach(() => resetRoster());

describe("AdminVolunteerRoster", () => {
  it("처음에는 4층 학생을 호실별로 묶어 보여 준다", () => {
    render(<AdminVolunteerRoster />);

    const room412 = screen.getByRole("region", { name: "412호" });
    expect(within(room412).getByText("3명")).toBeInTheDocument();
    expect(within(room412).getByText("김도현")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "415호" })).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "301호" }),
    ).not.toBeInTheDocument();
  });

  it("층 탭을 누르면 그 층의 호실로 바뀐다", () => {
    render(<AdminVolunteerRoster />);

    fireEvent.click(screen.getByRole("button", { name: "3층" }));

    expect(screen.getByRole("region", { name: "301호" })).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "412호" }),
    ).not.toBeInTheDocument();
  });

  it("행에 학번과 최근 활동을 보여 주고 활동이 없으면 -를 쓴다", () => {
    render(<AdminVolunteerRoster />);

    const row = screen.getByText("김도현").closest("div")
      ?.parentElement as HTMLElement;
    expect(within(row).getByText("2405")).toBeInTheDocument();
    expect(within(row).getByText("최근 활동 10/01")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "3층" }));
    const none = screen.getByText("서지안").closest("div")
      ?.parentElement as HTMLElement;
    expect(within(none).getByText("최근 활동 -")).toBeInTheDocument();
  });

  it("오늘 지정된 학생은 지정됨, 아니면 봉사자 지정 버튼이다", () => {
    render(<AdminVolunteerRoster />);

    expect(
      screen.getByRole("button", { name: "김도현 당일 봉사자로 지정됨" }),
    ).toHaveTextContent("지정됨");
    expect(
      screen.getByRole("button", { name: "박서연 당일 봉사자로 지정" }),
    ).toHaveTextContent("봉사자 지정");
  });

  it("횟수가 0이면 −는 비활성화한다", () => {
    render(<AdminVolunteerRoster />);

    expect(
      screen.getByRole("button", { name: "이지후 봉사 1회 차감" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "박서연 봉사 1회 차감" }),
    ).toBeEnabled();
  });

  it("호실 번호로 검색하면 그 호실만 남긴다", () => {
    render(<AdminVolunteerRoster />);

    fireEvent.change(screen.getByLabelText("봉사자 검색"), {
      target: { value: "413" },
    });

    expect(screen.getByRole("region", { name: "413호" })).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "412호" }),
    ).not.toBeInTheDocument();
  });

  it("결과가 없으면 안내 문구를 보여 준다", () => {
    render(<AdminVolunteerRoster />);

    fireEvent.change(screen.getByLabelText("봉사자 검색"), {
      target: { value: "없는이름" },
    });

    expect(screen.getByText("검색 결과가 없습니다.")).toBeInTheDocument();
  });

  it("명단 조회에 실패하면 오류 상태를 보여 준다", () => {
    render(<AdminVolunteerRoster listLoadFailed />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
