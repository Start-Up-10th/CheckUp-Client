import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { MOCK_VOLUNTEER_ROSTER } from "@/lib/admin/mock-volunteer-roster";
import { VolunteerGatewayProvider } from "@/lib/admin/volunteer-gateway";
import { resetRoster, setRoster } from "@/lib/admin/volunteer-roster-store";
import { AdminVolunteerRoster } from "./AdminVolunteerRoster";

beforeEach(() => setRoster(MOCK_VOLUNTEER_ROSTER));
afterEach(() => {
  cleanup();
  resetRoster();
});

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

    const row = screen.getByRole("group", { name: "김도현" });
    expect(within(row).getByText("2405")).toBeInTheDocument();
    expect(within(row).getByText("최근 활동 10/01")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "3층" }));
    const none = screen.getByRole("group", { name: "서지안" });
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

  it("명단을 받는 동안에는 불러오는 중을 보여 주고 받으면 명단을 보여 준다", async () => {
    resetRoster();
    const list = vi.fn().mockResolvedValue(MOCK_VOLUNTEER_ROSTER);

    render(
      <VolunteerGatewayProvider value={{ list }}>
        <AdminVolunteerRoster />
      </VolunteerGatewayProvider>,
    );

    expect(screen.getByText("불러오는 중…")).toBeInTheDocument();
    expect(
      await screen.findByRole("region", { name: "412호" }),
    ).toBeInTheDocument();
  });

  it("명단 조회에 실패하면 오류 상태를 보여 주고 다시 시도하면 불러온다", async () => {
    resetRoster();
    const list = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(MOCK_VOLUNTEER_ROSTER);

    render(
      <VolunteerGatewayProvider value={{ list }}>
        <AdminVolunteerRoster />
      </VolunteerGatewayProvider>,
    );

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(
      await screen.findByRole("region", { name: "412호" }),
    ).toBeInTheDocument();
    expect(list).toHaveBeenCalledTimes(2);
  });

  describe("횟수 가감", () => {
    it("+를 누르면 횟수가 늘고 성공 문구를 보여 준다", () => {
      render(<AdminVolunteerRoster />);

      fireEvent.click(
        screen.getByRole("button", { name: "박서연 봉사 1회 추가" }),
      );

      const row = screen.getByRole("group", { name: "박서연" });
      expect(within(row).getByText("2회")).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent(
        "봉사 횟수를 변경했습니다.",
      );
    });

    it("−를 누르면 횟수가 줄고 같은 성공 문구를 보여 준다", () => {
      render(<AdminVolunteerRoster />);

      fireEvent.click(
        screen.getByRole("button", { name: "박서연 봉사 1회 차감" }),
      );

      const row = screen.getByRole("group", { name: "박서연" });
      expect(within(row).getByText("0회")).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent(
        "봉사 횟수를 변경했습니다.",
      );
    });

    it("1회에서 −로 0회가 되면 −가 비활성화된다", () => {
      render(<AdminVolunteerRoster />);

      fireEvent.click(
        screen.getByRole("button", { name: "박서연 봉사 1회 차감" }),
      );

      expect(
        screen.getByRole("button", { name: "박서연 봉사 1회 차감" }),
      ).toBeDisabled();
    });
  });

  describe("당일 봉사자 지정", () => {
    it("횟수가 있는 학생을 지정하면 지정됨으로 바뀌고 성공 문구를 보여 준다", () => {
      render(<AdminVolunteerRoster />);

      fireEvent.click(
        screen.getByRole("button", { name: "박서연 당일 봉사자로 지정" }),
      );

      expect(
        screen.getByRole("button", { name: "박서연 당일 봉사자로 지정됨" }),
      ).toHaveTextContent("지정됨");
      expect(screen.getByRole("status")).toHaveTextContent(
        "당일 봉사자로 지정했습니다.",
      );
    });

    it("지정해도 횟수는 그대로다", () => {
      render(<AdminVolunteerRoster />);

      fireEvent.click(
        screen.getByRole("button", { name: "박서연 당일 봉사자로 지정" }),
      );

      const row = screen.getByRole("group", { name: "박서연" });
      expect(within(row).getByText("1회")).toBeInTheDocument();
    });

    it("횟수가 0인 학생은 지정하지 않고 봉사가 없다고 알린다", () => {
      render(<AdminVolunteerRoster />);

      fireEvent.click(
        screen.getByRole("button", { name: "이지후 당일 봉사자로 지정" }),
      );

      expect(screen.getByRole("status")).toHaveTextContent("봉사가 없습니다.");
      expect(
        screen.getByRole("button", { name: "이지후 당일 봉사자로 지정" }),
      ).toHaveTextContent("봉사자 지정");
    });

    it("이미 지정된 학생을 누르면 이미 지정됐다고 알린다", () => {
      render(<AdminVolunteerRoster />);

      fireEvent.click(
        screen.getByRole("button", { name: "김도현 당일 봉사자로 지정됨" }),
      );

      expect(screen.getByRole("status")).toHaveTextContent(
        "이미 당일 봉사자로 지정된 학생입니다.",
      );
    });

    it("지정한 학생은 다른 화면에서 같은 명단으로 보인다", () => {
      const { unmount } = render(<AdminVolunteerRoster />);
      fireEvent.click(
        screen.getByRole("button", { name: "박서연 당일 봉사자로 지정" }),
      );
      unmount();

      render(<AdminVolunteerRoster />);

      expect(
        screen.getByRole("button", { name: "박서연 당일 봉사자로 지정됨" }),
      ).toBeInTheDocument();
    });
  });
});
