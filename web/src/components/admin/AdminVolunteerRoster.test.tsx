import {
  cleanup,
  fireEvent,
  render as renderPlain,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ReactElement } from "react";
import { MOCK_VOLUNTEER_ROSTER } from "@/lib/admin/mock-volunteer-roster";
import { VolunteerGatewayProvider } from "@/lib/admin/volunteer-gateway";
import { createMockVolunteerGateway } from "@/lib/admin/volunteer-mock-gateway";
import { resetRoster, setRoster } from "@/lib/admin/volunteer-roster-store";
import { AdminVolunteerRoster } from "./AdminVolunteerRoster";

const mockGateway = createMockVolunteerGateway();

/** 서버 대신 목업 게이트웨이를 쓰는 화면. */
function render(ui: ReactElement) {
  return renderPlain(
    <VolunteerGatewayProvider value={mockGateway}>
      {ui}
    </VolunteerGatewayProvider>,
  );
}

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

    renderPlain(
      <VolunteerGatewayProvider value={{ ...mockGateway, list }}>
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

    renderPlain(
      <VolunteerGatewayProvider value={{ ...mockGateway, list }}>
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
    it("+를 누르면 횟수가 늘고 성공 문구를 보여 준다", async () => {
      render(<AdminVolunteerRoster />);

      fireEvent.click(
        screen.getByRole("button", { name: "박서연 봉사 1회 추가" }),
      );

      expect(await screen.findByRole("status")).toHaveTextContent(
        "봉사 횟수를 변경했습니다.",
      );
      const row = screen.getByRole("group", { name: "박서연" });
      expect(within(row).getByText("2회")).toBeInTheDocument();
    });

    it("−를 누르면 횟수가 줄고 같은 성공 문구를 보여 준다", async () => {
      render(<AdminVolunteerRoster />);

      fireEvent.click(
        screen.getByRole("button", { name: "박서연 봉사 1회 차감" }),
      );

      expect(await screen.findByRole("status")).toHaveTextContent(
        "봉사 횟수를 변경했습니다.",
      );
      const row = screen.getByRole("group", { name: "박서연" });
      expect(within(row).getByText("0회")).toBeInTheDocument();
    });

    it("1회에서 −로 0회가 되면 −가 비활성화된다", async () => {
      render(<AdminVolunteerRoster />);

      fireEvent.click(
        screen.getByRole("button", { name: "박서연 봉사 1회 차감" }),
      );

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "박서연 봉사 1회 차감" }),
        ).toBeDisabled(),
      );
    });

    it("서버가 실패하면 횟수 변경 실패 오류 문구를 보여 주고 횟수는 그대로다", async () => {
      const adjustCount = vi.fn().mockRejectedValue(new Error("network"));
      renderPlain(
        <VolunteerGatewayProvider value={{ ...mockGateway, adjustCount }}>
          <AdminVolunteerRoster />
        </VolunteerGatewayProvider>,
      );

      fireEvent.click(
        screen.getByRole("button", { name: "박서연 봉사 1회 추가" }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "봉사 횟수 변경에 실패했습니다. 다시 시도해 주세요.",
      );
      const row = screen.getByRole("group", { name: "박서연" });
      expect(within(row).getByText("1회")).toBeInTheDocument();
    });

    it("누른 방향과 학생의 서버 ID로 한 번만 요청한다", async () => {
      const adjustCount = vi
        .fn()
        .mockImplementation((id: number, delta: 1 | -1) =>
          mockGateway.adjustCount(id, delta),
        );
      renderPlain(
        <VolunteerGatewayProvider value={{ ...mockGateway, adjustCount }}>
          <AdminVolunteerRoster />
        </VolunteerGatewayProvider>,
      );
      const seoyeon = MOCK_VOLUNTEER_ROSTER.find(
        (student) => student.name === "박서연",
      )!;
      const button = screen.getByRole("button", {
        name: "박서연 봉사 1회 추가",
      });

      fireEvent.click(button);
      fireEvent.click(button);
      await screen.findByRole("status");

      expect(adjustCount).toHaveBeenCalledTimes(1);
      expect(adjustCount).toHaveBeenCalledWith(seoyeon.id, 1);
    });
  });

  describe("당일 봉사자 지정", () => {
    it("횟수가 있는 학생을 지정하면 지정됨으로 바뀌고 성공 문구를 보여 준다", async () => {
      render(<AdminVolunteerRoster />);

      fireEvent.click(
        screen.getByRole("button", { name: "박서연 당일 봉사자로 지정" }),
      );

      expect(
        await screen.findByRole("button", {
          name: "박서연 당일 봉사자로 지정됨",
        }),
      ).toHaveTextContent("지정됨");
      expect(screen.getByRole("status")).toHaveTextContent(
        "당일 봉사자로 지정했습니다.",
      );
    });

    it("지정해도 횟수는 그대로다", async () => {
      render(<AdminVolunteerRoster />);

      fireEvent.click(
        screen.getByRole("button", { name: "박서연 당일 봉사자로 지정" }),
      );
      await screen.findByRole("button", {
        name: "박서연 당일 봉사자로 지정됨",
      });

      const row = screen.getByRole("group", { name: "박서연" });
      expect(within(row).getByText("1회")).toBeInTheDocument();
    });

    it("서버가 봉사 없음(NO_VOLUNTEER_LEFT)으로 막으면 봉사가 없다고 알린다", async () => {
      render(<AdminVolunteerRoster />);

      fireEvent.click(
        screen.getByRole("button", { name: "이지후 당일 봉사자로 지정" }),
      );

      expect(await screen.findByRole("status")).toHaveTextContent(
        "봉사가 없습니다.",
      );
      expect(
        screen.getByRole("button", { name: "이지후 당일 봉사자로 지정" }),
      ).toHaveTextContent("봉사자 지정");
    });

    it("서버가 이미 지정됨(ALREADY_ON_DUTY)으로 막으면 이미 지정됐다고 알린다", async () => {
      render(<AdminVolunteerRoster />);

      fireEvent.click(
        screen.getByRole("button", { name: "김도현 당일 봉사자로 지정됨" }),
      );

      expect(await screen.findByRole("status")).toHaveTextContent(
        "이미 당일 봉사자로 지정된 학생입니다.",
      );
    });

    it("서버가 이유 없이 실패하면 지정 실패 오류 문구를 보여 준다", async () => {
      const designate = vi.fn().mockRejectedValue(new Error("network"));
      renderPlain(
        <VolunteerGatewayProvider value={{ ...mockGateway, designate }}>
          <AdminVolunteerRoster />
        </VolunteerGatewayProvider>,
      );

      fireEvent.click(
        screen.getByRole("button", { name: "박서연 당일 봉사자로 지정" }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "당일 봉사자 지정에 실패했습니다. 다시 시도해 주세요.",
      );
      expect(
        screen.getByRole("button", { name: "박서연 당일 봉사자로 지정" }),
      ).toBeInTheDocument();
    });

    it("지정 요청이 끝나기 전에 다시 눌러도 서버에는 한 번만 보낸다", async () => {
      const designate = vi
        .fn()
        .mockImplementation((id: number) => mockGateway.designate(id));
      renderPlain(
        <VolunteerGatewayProvider value={{ ...mockGateway, designate }}>
          <AdminVolunteerRoster />
        </VolunteerGatewayProvider>,
      );
      const button = screen.getByRole("button", {
        name: "박서연 당일 봉사자로 지정",
      });

      fireEvent.click(button);
      fireEvent.click(button);
      await screen.findByRole("button", {
        name: "박서연 당일 봉사자로 지정됨",
      });

      expect(designate).toHaveBeenCalledTimes(1);
    });

    it("지정한 학생은 다른 화면에서 같은 명단으로 보인다", async () => {
      const { unmount } = render(<AdminVolunteerRoster />);
      fireEvent.click(
        screen.getByRole("button", { name: "박서연 당일 봉사자로 지정" }),
      );
      await screen.findByRole("button", {
        name: "박서연 당일 봉사자로 지정됨",
      });
      unmount();

      render(<AdminVolunteerRoster />);

      expect(
        screen.getByRole("button", { name: "박서연 당일 봉사자로 지정됨" }),
      ).toBeInTheDocument();
    });
  });
});
