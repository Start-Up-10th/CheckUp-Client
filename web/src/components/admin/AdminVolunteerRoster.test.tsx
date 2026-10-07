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
import { AdminUnauthorizedError } from "@/lib/admin/qr-api";
import { RateLimitedError } from "@/lib/rate-limit";
import { VolunteerApiError } from "@/lib/admin/volunteer-api";
import { VolunteerGatewayProvider } from "@/lib/admin/volunteer-gateway";
import { VolunteerHistoryGatewayProvider } from "@/lib/admin/volunteer-history-gateway";
import { createMockVolunteerHistoryGateway } from "@/lib/admin/volunteer-history-mock-gateway";
import { createMockVolunteerGateway } from "@/lib/admin/volunteer-mock-gateway";
import { resetRoster, setRoster } from "@/lib/admin/volunteer-roster-store";
import { AdminVolunteerRoster } from "./AdminVolunteerRoster";

const redirectToAdminLogin = vi.hoisted(() => vi.fn());
vi.mock("@/lib/admin/admin-session", () => ({ redirectToAdminLogin }));

const mockGateway = createMockVolunteerGateway();
const mockHistoryGateway = createMockVolunteerHistoryGateway();

/** 서버 대신 목업 게이트웨이를 쓰는 화면. */
function render(ui: ReactElement) {
  return renderPlain(
    <VolunteerGatewayProvider value={mockGateway}>
      <VolunteerHistoryGatewayProvider value={mockHistoryGateway}>
        {ui}
      </VolunteerHistoryGatewayProvider>
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

  it("행에는 횟수 글자만 있고 −/+ 버튼은 없다", () => {
    render(<AdminVolunteerRoster />);

    const row = screen.getByRole("group", { name: "박서연" });
    expect(within(row).getByText("1회")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /봉사 1회 (차감|추가)/ }),
    ).not.toBeInTheDocument();
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

  it("명단 조회가 429로 막히면 잠시 후 다시 시도 안내를 보인다", async () => {
    resetRoster();
    const list = vi.fn().mockRejectedValue(new RateLimitedError(2000));

    renderPlain(
      <VolunteerGatewayProvider value={{ ...mockGateway, list }}>
        <AdminVolunteerRoster />
      </VolunteerGatewayProvider>,
    );

    expect(
      await screen.findByText("잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "학생 명단을 불러오지 못했습니다. 다시 시도해 주세요.",
      ),
    ).not.toBeInTheDocument();
  });

  it("명단 조회에 실패하면 오류 상태와 명단 조회 실패 문구를 보여 주고 다시 시도하면 불러온다", async () => {
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

    expect(await screen.findByText("불러오지 못했어요")).toBeInTheDocument();
    expect(
      screen.getByText("학생 명단을 불러오지 못했습니다. 다시 시도해 주세요."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(
      await screen.findByRole("region", { name: "412호" }),
    ).toBeInTheDocument();
    expect(list).toHaveBeenCalledTimes(2);
  });

  describe("학생 상세", () => {
    it("학생 행을 누르면 남은 횟수와 봉사 이력을 보여 준다", async () => {
      render(<AdminVolunteerRoster />);

      fireEvent.click(screen.getByRole("button", { name: "김도현 학생 상세" }));

      const dialog = screen.getByRole("dialog", { name: "김도현" });
      expect(within(dialog).getByText("2405 · 412호")).toBeInTheDocument();
      expect(within(dialog).getByText("남은 봉사 횟수")).toBeInTheDocument();
      expect(within(dialog).getByText("3회")).toBeInTheDocument();
      expect(await within(dialog).findByText("도서관 정리 봉사")).toBeVisible();
      expect(within(dialog).getAllByText("+1회").length).toBeGreaterThan(0);
      expect(within(dialog).getByText("−1회")).toBeInTheDocument();
    });

    it("닫기를 누르면 다이얼로그가 닫힌다", () => {
      render(<AdminVolunteerRoster />);
      fireEvent.click(screen.getByRole("button", { name: "김도현 학생 상세" }));

      fireEvent.click(screen.getByRole("button", { name: "닫기" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("지정 버튼을 눌러도 상세 다이얼로그는 열리지 않는다", async () => {
      render(<AdminVolunteerRoster />);

      fireEvent.click(
        screen.getByRole("button", { name: "박서연 당일 봉사자로 지정" }),
      );

      await screen.findByRole("status");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("이력이 없으면 안내 문구를 보여 준다", async () => {
      renderPlain(
        <VolunteerGatewayProvider value={mockGateway}>
          <VolunteerHistoryGatewayProvider value={{ list: async () => [] }}>
            <AdminVolunteerRoster />
          </VolunteerHistoryGatewayProvider>
        </VolunteerGatewayProvider>,
      );
      fireEvent.click(screen.getByRole("button", { name: "김도현 학생 상세" }));

      expect(
        await screen.findByText("봉사 이력이 없습니다."),
      ).toBeInTheDocument();
    });

    it("이력 조회에 실패하면 오류 문구를 보여 준다", async () => {
      renderPlain(
        <VolunteerGatewayProvider value={mockGateway}>
          <VolunteerHistoryGatewayProvider
            value={{ list: () => Promise.reject(new Error("fail")) }}
          >
            <AdminVolunteerRoster />
          </VolunteerHistoryGatewayProvider>
        </VolunteerGatewayProvider>,
      );
      fireEvent.click(screen.getByRole("button", { name: "김도현 학생 상세" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "봉사 이력을 불러오지 못했습니다. 다시 시도해 주세요.",
      );
    });
    it("한 번에 여러 회 바뀐 이력은 그 횟수로 보여 준다", async () => {
      renderPlain(
        <VolunteerGatewayProvider value={mockGateway}>
          <VolunteerHistoryGatewayProvider
            value={{
              list: async () => [
                { id: "a", date: "10/02", title: "청소 당번 대체", delta: -3 },
                { id: "b", date: "09/17", title: "봉사 횟수 추가", delta: 2 },
              ],
            }}
          >
            <AdminVolunteerRoster />
          </VolunteerHistoryGatewayProvider>
        </VolunteerGatewayProvider>,
      );
      fireEvent.click(screen.getByRole("button", { name: "김도현 학생 상세" }));

      expect(await screen.findByText("−3회")).toBeInTheDocument();
      expect(screen.getByText("+2회")).toBeInTheDocument();
      expect(screen.getByText("청소 당번 대체")).toBeInTheDocument();
    });

    it("이력이 많아도 다이얼로그는 화면 높이 안에 있고 이력 목록만 스크롤한다", async () => {
      const many = Array.from({ length: 40 }, (_, index) => ({
        id: `h${index}`,
        date: "10/04",
        title: `봉사 횟수 추가 ${index}`,
        delta: 1,
      }));
      renderPlain(
        <VolunteerGatewayProvider value={mockGateway}>
          <VolunteerHistoryGatewayProvider value={{ list: async () => many }}>
            <AdminVolunteerRoster />
          </VolunteerHistoryGatewayProvider>
        </VolunteerGatewayProvider>,
      );
      fireEvent.click(screen.getByRole("button", { name: "김도현 학생 상세" }));

      const dialog = screen.getByRole("dialog", { name: "김도현" });
      await within(dialog).findByText("봉사 횟수 추가 0");
      const list = dialog.querySelector("[data-history-list]");

      expect(dialog).toHaveClass("max-h-[calc(100dvh-32px)]");
      expect(list).toHaveClass("overflow-y-auto", "min-h-0");
      // 이력은 5줄 높이까지만 보인다(줄 36px·간격 6px, 컴퓨터는 줄 39px).
      expect(list).toHaveClass("max-h-[204px]", "xl:max-h-[219px]");
      expect(list?.children).toHaveLength(40);
      // 제목·남은 횟수·닫기 버튼은 스크롤 목록 밖에 있다.
      expect(list).not.toContainElement(
        within(dialog).getByRole("button", { name: "닫기" }),
      );
    });

    it("이력을 받다가 로그인이 끊기면(401) 관리자 로그인으로 보낸다", async () => {
      renderPlain(
        <VolunteerGatewayProvider value={mockGateway}>
          <VolunteerHistoryGatewayProvider
            value={{
              list: () => Promise.reject(new AdminUnauthorizedError()),
            }}
          >
            <AdminVolunteerRoster />
          </VolunteerHistoryGatewayProvider>
        </VolunteerGatewayProvider>,
      );
      fireEvent.click(screen.getByRole("button", { name: "김도현 학생 상세" }));

      await waitFor(() =>
        expect(redirectToAdminLogin).toHaveBeenCalledTimes(1),
      );
    });
  });

  describe("하단 바", () => {
    const barLink = () => screen.queryByRole("link", { name: "봉사자 관리 →" });

    it("처음 들어오면 오늘 지정된 학생이 있어도 바가 없다", () => {
      render(<AdminVolunteerRoster />);

      expect(barLink()).not.toBeInTheDocument();
    });

    it("봉사자 지정을 누르면 바가 나타나고 지정할 때마다 인원이 늘어난다", async () => {
      render(<AdminVolunteerRoster />);

      fireEvent.click(
        screen.getByRole("button", { name: "박서연 당일 봉사자로 지정" }),
      );
      await screen.findByRole("button", {
        name: "박서연 당일 봉사자로 지정됨",
      });
      const link = barLink()!;
      expect(link).toHaveAttribute("href", "/admin/volunteers");
      expect(link.parentElement).toHaveTextContent("당일 지정 3명");
      // Figma 위치(패널 아래에서 40px 위)와 나타나는 애니메이션(동작 줄이기에서는 끔).
      expect(link.parentElement).toHaveClass(
        "xl:bottom-[68px]",
        "animate-bar-rise",
        "motion-reduce:animate-none",
      );

      fireEvent.click(screen.getByRole("button", { name: "3층" }));
      fireEvent.click(
        screen.getByRole("button", { name: "백도윤 당일 봉사자로 지정" }),
      );
      await waitFor(() =>
        expect(barLink()!.parentElement).toHaveTextContent("당일 지정 4명"),
      );
    });

    it("완료한 학생은 인원에서 빼고 아직 완료하지 않은 지정만 센다", async () => {
      let first = true;
      setRoster(
        MOCK_VOLUNTEER_ROSTER.map((student) => {
          if (student.duty !== "designated") return student;
          const next = first
            ? { ...student, duty: "completed" as const }
            : student;
          first = false;
          return next;
        }),
      );
      render(<AdminVolunteerRoster />);

      fireEvent.click(
        screen.getByRole("button", { name: "박서연 당일 봉사자로 지정" }),
      );

      await waitFor(() =>
        expect(barLink()!.parentElement).toHaveTextContent("당일 지정 2명"),
      );
      expect(
        screen.getByText(/전교생 \d+명 · 당일 지정 2명/),
      ).toBeInTheDocument();
    });

    it("지정에 실패하면 바가 나타나지 않는다", async () => {
      const designate = vi.fn().mockRejectedValue(new Error("network"));
      renderPlain(
        <VolunteerGatewayProvider value={{ ...mockGateway, designate }}>
          <AdminVolunteerRoster />
        </VolunteerGatewayProvider>,
      );

      fireEvent.click(
        screen.getByRole("button", { name: "박서연 당일 봉사자로 지정" }),
      );

      await screen.findByRole("alert");
      expect(barLink()).not.toBeInTheDocument();
    });

    it("봉사자 관리에 다녀와 다시 들어오면 지정하기 전까지 바가 숨겨진다", async () => {
      const first = render(<AdminVolunteerRoster />);
      fireEvent.click(
        screen.getByRole("button", { name: "박서연 당일 봉사자로 지정" }),
      );
      await waitFor(() => expect(barLink()).toBeInTheDocument());

      first.unmount();
      render(<AdminVolunteerRoster />);

      expect(barLink()).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "박서연 당일 봉사자로 지정됨" }),
      ).toBeInTheDocument();
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

    it("남은 횟수가 0회인 학생의 지정 버튼은 비활성이라 눌러도 요청이 나가지 않는다", () => {
      const designate = vi.fn();
      renderPlain(
        <VolunteerGatewayProvider value={{ ...mockGateway, designate }}>
          <AdminVolunteerRoster />
        </VolunteerGatewayProvider>,
      );
      const button = screen.getByRole("button", {
        name: "이지후 당일 봉사자로 지정",
      });

      expect(button).toBeDisabled();
      expect(button).toHaveClass("bg-admin-border", "text-admin-textFaint");
      fireEvent.click(button);

      expect(designate).not.toHaveBeenCalled();
      expect(
        screen.getByRole("button", { name: "박서연 당일 봉사자로 지정" }),
      ).toBeEnabled();
    });

    it("서버가 봉사 없음(NO_VOLUNTEER_LEFT)으로 막으면(화면 횟수가 낡은 경우) 봉사가 없다고 알린다", async () => {
      const designate = vi
        .fn()
        .mockRejectedValue(new VolunteerApiError(409, "NO_VOLUNTEER_LEFT"));
      renderPlain(
        <VolunteerGatewayProvider value={{ ...mockGateway, designate }}>
          <AdminVolunteerRoster />
        </VolunteerGatewayProvider>,
      );

      fireEvent.click(
        screen.getByRole("button", { name: "박서연 당일 봉사자로 지정" }),
      );

      expect(await screen.findByRole("status")).toHaveTextContent(
        "봉사가 없습니다.",
      );
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
