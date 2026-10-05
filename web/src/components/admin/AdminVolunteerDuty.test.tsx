import {
  act,
  cleanup,
  fireEvent,
  render as renderPlain,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactElement } from "react";
import { MOCK_VOLUNTEER_ROSTER } from "@/lib/admin/mock-volunteer-roster";
import { VolunteerApiError } from "@/lib/admin/volunteer-api";
import { VolunteerGatewayProvider } from "@/lib/admin/volunteer-gateway";
import { createMockVolunteerGateway } from "@/lib/admin/volunteer-mock-gateway";
import {
  getRoster,
  resetRoster,
  setRoster,
} from "@/lib/admin/volunteer-roster-store";
import { AdminVolunteerDuty } from "./AdminVolunteerDuty";

const mockGateway = createMockVolunteerGateway();

/** 서버 대신 목업 게이트웨이를 쓰는 화면. */
function render(ui: ReactElement) {
  return renderPlain(
    <VolunteerGatewayProvider value={mockGateway}>
      {ui}
    </VolunteerGatewayProvider>,
  );
}

beforeEach(() => {
  // 2026-10-01 12:00 KST. 타이머는 그대로 두고 날짜만 고정한다.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-01T03:00:00Z"));
  setRoster(MOCK_VOLUNTEER_ROSTER);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  resetRoster();
});

function countOf(studentId: string) {
  return getRoster().find((student) => student.studentId === studentId)?.count;
}

describe("AdminVolunteerDuty", () => {
  it("오늘 운영일과 지정된 학생 수, 학생별 학번·호실을 보여 준다", () => {
    render(<AdminVolunteerDuty />);

    expect(screen.getByText("10/01 당일 봉사자")).toBeInTheDocument();
    expect(screen.getByText("2명")).toBeInTheDocument();
    expect(screen.getByText("김도현")).toBeInTheDocument();
    expect(screen.getByText("2405 · 412호")).toBeInTheDocument();
    expect(screen.getByText("정민수")).toBeInTheDocument();
    expect(screen.getByText("2401 · 412호")).toBeInTheDocument();
  });

  it("패드용으로 행마다 최근 활동을 N월 D일로, 패널 안에는 요약 줄을 둔다", () => {
    render(<AdminVolunteerDuty />);

    expect(screen.getAllByText("10월 1일")).toHaveLength(2);
    expect(screen.getByText("10/01 당일 봉사자 · 2명")).toBeInTheDocument();
  });

  it("명단에서 지정 링크는 봉사자 명단 편집으로 간다", () => {
    render(<AdminVolunteerDuty />);

    expect(
      screen.getByRole("link", { name: "+ 명단에서 지정" }),
    ).toHaveAttribute("href", "/admin/volunteers/add");
  });

  it("명단에서 지정 링크 주소를 바꿀 수 있다", () => {
    render(
      <AdminVolunteerDuty rosterHref="/admin/state-demo/volunteer-roster" />,
    );

    expect(
      screen.getByRole("link", { name: "+ 명단에서 지정" }),
    ).toHaveAttribute("href", "/admin/state-demo/volunteer-roster");
  });

  it("완료하면 목록에서 빠지고 횟수를 1 줄이며 완료 문구를 보여 준다", async () => {
    render(<AdminVolunteerDuty />);
    expect(countOf("2405")).toBe(3);

    fireEvent.click(screen.getByRole("button", { name: "김도현 봉사 완료" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "봉사를 완료 처리했습니다.",
    );
    expect(screen.queryByText("김도현")).not.toBeInTheDocument();
    expect(screen.getByText("1명")).toBeInTheDocument();
    expect(countOf("2405")).toBe(2);
  });

  it("봉사 제외는 목록에서 빼지만 횟수는 바꾸지 않는다", async () => {
    render(<AdminVolunteerDuty />);

    fireEvent.click(
      screen.getByRole("button", { name: "정민수 당일 봉사자에서 제외" }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "당일 봉사자에서 제외했습니다.",
    );
    expect(screen.queryByText("정민수")).not.toBeInTheDocument();
    expect(countOf("2401")).toBe(2);
    expect(
      getRoster().find((student) => student.studentId === "2401")?.duty,
    ).toBe("none");
  });

  it("서버가 완료를 막으면(DUTY_ALREADY_COMPLETED) 안내하고 목록을 다시 받는다", async () => {
    const completeDuty = vi
      .fn()
      .mockRejectedValue(new VolunteerApiError(409, "DUTY_ALREADY_COMPLETED"));
    const list = vi.fn().mockResolvedValue(MOCK_VOLUNTEER_ROSTER);
    renderPlain(
      <VolunteerGatewayProvider value={{ ...mockGateway, completeDuty, list }}>
        <AdminVolunteerDuty />
      </VolunteerGatewayProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "김도현 봉사 완료" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "이미 봉사를 완료했습니다.",
    );
    await waitFor(() => expect(list).toHaveBeenCalledTimes(1));
    expect(screen.getByText("김도현")).toBeInTheDocument();
  });

  it("서버가 이유 없이 실패하면 처리 실패 오류 문구를 보여 주고 목록은 그대로다", async () => {
    const completeDuty = vi.fn().mockRejectedValue(new Error("network"));
    renderPlain(
      <VolunteerGatewayProvider value={{ ...mockGateway, completeDuty }}>
        <AdminVolunteerDuty />
      </VolunteerGatewayProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "김도현 봉사 완료" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "처리에 실패했습니다. 다시 시도해 주세요.",
    );
    expect(screen.getByText("김도현")).toBeInTheDocument();
    expect(countOf("2405")).toBe(3);
  });

  it("호실이 배정되지 않은 지정 학생은 호실 대신 미배정으로 보여 준다", () => {
    act(() =>
      setRoster([
        {
          id: 99,
          studentId: "2499",
          name: "가나다",
          roomNumber: null,
          count: 1,
          duty: "designated",
        },
      ]),
    );

    render(<AdminVolunteerDuty />);

    expect(screen.getByText("2499 · 미배정")).toBeInTheDocument();
  });

  it("지정된 학생이 없으면 안내 문구를 보여 준다", () => {
    act(() =>
      setRoster(
        MOCK_VOLUNTEER_ROSTER.map((student) => ({ ...student, duty: "none" })),
      ),
    );

    render(<AdminVolunteerDuty />);

    expect(screen.getByText("0명")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "오늘 지정된 봉사자가 없습니다. 봉사자 명단에서 지정해 주세요.",
    );
  });

  it("목록 조회에 실패하면 오류 상태와 목록 조회 실패 문구를 보여 준다", async () => {
    resetRoster();
    const list = vi.fn().mockRejectedValue(new Error("network"));

    renderPlain(
      <VolunteerGatewayProvider value={{ ...mockGateway, list }}>
        <AdminVolunteerDuty />
      </VolunteerGatewayProvider>,
    );

    expect(await screen.findByText("불러오지 못했어요")).toBeInTheDocument();
    expect(
      screen.getByText(
        "당일 봉사자 목록을 불러오지 못했습니다. 다시 시도해 주세요.",
      ),
    ).toBeInTheDocument();
  });

  it("목록을 받는 동안에는 빈 안내 대신 불러오는 중을 보여 준다", () => {
    resetRoster();
    const list = vi.fn().mockReturnValue(new Promise(() => {}));

    renderPlain(
      <VolunteerGatewayProvider value={{ ...mockGateway, list }}>
        <AdminVolunteerDuty />
      </VolunteerGatewayProvider>,
    );

    expect(screen.getByText("불러오는 중…")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("08:00 전에는 아직 전날 운영일로 보여 준다", () => {
    // 2026-10-02 07:30 KST
    vi.setSystemTime(new Date("2026-10-01T22:30:00Z"));

    render(<AdminVolunteerDuty />);

    expect(screen.getByText("10/01 당일 봉사자")).toBeInTheDocument();
  });
});
