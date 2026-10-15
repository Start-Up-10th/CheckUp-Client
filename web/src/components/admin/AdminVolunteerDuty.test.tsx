import {
  act,
  cleanup,
  fireEvent,
  render as renderPlain,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ReactElement } from "react";
import { MOCK_VOLUNTEER_ROSTER } from "@/lib/admin/mock-volunteer-roster";
import { VolunteerApiError } from "@/lib/admin/volunteer-api";
import { StudentManagementGatewayProvider } from "@/lib/admin/student-management-gateway";
import { createMockStudentManagementGateway } from "@/lib/admin/student-management-mock-gateway";
import { VolunteerGatewayProvider } from "@/lib/admin/volunteer-gateway";
import { createMockVolunteerGateway } from "@/lib/admin/volunteer-mock-gateway";
import {
  getRoster,
  resetRoster,
  setRoster,
} from "@/lib/admin/volunteer-roster-store";
import { AdminVolunteerDuty } from "./AdminVolunteerDuty";

// 지난 기록이 오늘 기준 날짜로 만들어지므로 날짜를 고정한 뒤(beforeEach) 매 테스트마다 새로 만든다.
let mockGateway = createMockVolunteerGateway();

/** 서버 대신 목업 게이트웨이를 쓰는 화면. */
function render(ui: ReactElement) {
  return renderPlain(
    <VolunteerGatewayProvider value={mockGateway}>
      <StudentManagementGatewayProvider
        value={createMockStudentManagementGateway()}
      >
        {ui}
      </StudentManagementGatewayProvider>
    </VolunteerGatewayProvider>,
  );
}

beforeEach(() => {
  // 2026-10-01 12:00 KST. 타이머는 그대로 두고 날짜만 고정한다.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-01T03:00:00Z"));
  mockGateway = createMockVolunteerGateway();
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

  it("명단 수정 링크는 봉사자 명단 편집으로 간다", () => {
    render(<AdminVolunteerDuty />);

    expect(screen.getByRole("link", { name: "+ 명단 수정" })).toHaveAttribute(
      "href",
      "/admin/volunteers/add",
    );
  });

  it("명단 수정 링크 주소를 바꿀 수 있다", () => {
    render(
      <AdminVolunteerDuty rosterHref="/admin/state-demo/volunteer-roster" />,
    );

    expect(screen.getByRole("link", { name: "+ 명단 수정" })).toHaveAttribute(
      "href",
      "/admin/state-demo/volunteer-roster",
    );
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
    // 가로 배너가 아니라 공통 빈 상태 화면(아이콘 + `아직 데이터가 없어요`)으로 보인다.
    expect(screen.getByText("아직 데이터가 없어요")).toBeInTheDocument();
    expect(
      screen.getByText(
        "오늘 지정된 봉사자가 없습니다. 봉사자 명단에서 지정해 주세요.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
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

  it("미이행을 누르면 횟수·사유 다이얼로그가 현재 횟수 + 1과 기본 사유로 열린다", () => {
    render(<AdminVolunteerDuty />);

    fireEvent.click(screen.getByRole("button", { name: "김도현 봉사 미이행" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("김도현");
    expect(dialog).toHaveTextContent("4회");
    expect(screen.getByPlaceholderText("사유를 입력해 주세요")).toHaveValue(
      "당일 봉사 미이행",
    );
  });

  it("미이행을 저장하면 지정이 미이행이 되고 횟수가 더해지며 목록에서 빠진다", async () => {
    render(<AdminVolunteerDuty />);
    expect(countOf("2405")).toBe(3);

    fireEvent.click(screen.getByRole("button", { name: "김도현 봉사 미이행" }));
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "미이행으로 처리하고 봉사 횟수를 변경했습니다.",
    );
    expect(screen.queryByText("김도현")).not.toBeInTheDocument();
    expect(countOf("2405")).toBe(4);
    expect(
      getRoster().find((student) => student.studentId === "2405")?.duty,
    ).toBe("missed");
  });

  it("미이행 저장이 실패하면 오류 문구를 보여 주고 목록과 횟수는 그대로다", async () => {
    const markMissed = vi.fn().mockRejectedValue(new Error("network"));
    renderPlain(
      <VolunteerGatewayProvider value={{ ...mockGateway, markMissed }}>
        <AdminVolunteerDuty />
      </VolunteerGatewayProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "김도현 봉사 미이행" }));
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "처리에 실패했습니다. 다시 시도해 주세요.",
    );
    expect(markMissed).toHaveBeenCalled();
    expect(screen.getAllByText("김도현").length).toBeGreaterThan(0);
    expect(screen.getByRole("dialog", { name: "김도현" })).toBeInTheDocument();
    expect(countOf("2405")).toBe(3);
  });

  it("서버가 횟수를 이미 처리했다고 막으면 안내하고 목록을 다시 받는다", async () => {
    const markMissed = vi
      .fn()
      .mockRejectedValue(new VolunteerApiError(409, "DUTY_ALREADY_ADJUSTED"));
    const list = vi.fn().mockResolvedValue(MOCK_VOLUNTEER_ROSTER);
    renderPlain(
      <VolunteerGatewayProvider value={{ ...mockGateway, markMissed, list }}>
        <AdminVolunteerDuty />
      </VolunteerGatewayProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "김도현 봉사 미이행" }));
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "이미 횟수를 처리한 미이행입니다. 학생 관리에서 조정해 주세요.",
    );
    await waitFor(() => expect(list).toHaveBeenCalledTimes(1));
  });

  it("달력 버튼에는 오늘 운영일의 연월일이 보인다", () => {
    render(<AdminVolunteerDuty />);

    expect(
      screen.getByRole("button", { name: "날짜 선택, 지금 2026.10.01" }),
    ).toHaveTextContent("2026.10.01");
  });

  it("달력에서 미이행이 있는 날을 누르면 그날 안 한 학생이 보이고, 누르면 횟수를 조정한다", async () => {
    render(<AdminVolunteerDuty />);

    fireEvent.click(
      screen.getByRole("button", { name: "날짜 선택, 지금 2026.10.01" }),
    );
    // 목업 기록은 오늘(10월 1일) 기준 하루 전인 9월 30일에 미이행 2명이 있어 이전 달에서 점이 보인다.
    fireEvent.click(screen.getByRole("button", { name: "이전 달" }));
    fireEvent.click(
      await screen.findByRole("button", {
        name: "2026년 9월 30일, 미이행 2명",
      }),
    );

    const calendar = screen.getByRole("dialog", { name: "날짜 선택" });
    expect(
      await within(calendar).findByText("2026년 9월 30일 미이행"),
    ).toBeInTheDocument();
    fireEvent.click(within(calendar).getByRole("button", { name: /류하준/ }));

    const adjust = await screen.findByRole("dialog", { name: "류하준" });
    expect(adjust).toHaveTextContent("302호");
    expect(adjust).toHaveTextContent("1회");
  });

  it("지난 기록을 받을 수 없는 연결이면 지난 날짜를 안내 문구로 보여 준다", () => {
    const { history: _history, ...withoutHistory } = mockGateway;
    void _history;
    renderPlain(
      <VolunteerGatewayProvider value={withoutHistory}>
        <AdminVolunteerDuty />
      </VolunteerGatewayProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "날짜 선택, 지금 2026.10.01" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "이전 달" }));
    fireEvent.click(screen.getByRole("button", { name: "2026년 9월 15일" }));

    expect(
      screen.getAllByText(
        "지난 날짜의 봉사자 기록을 불러올 수 없는 연결입니다.",
      ).length,
    ).toBeGreaterThan(0);
  });

  it("08:00 전에는 아직 전날 운영일로 보여 준다", () => {
    // 2026-10-02 07:30 KST
    vi.setSystemTime(new Date("2026-10-01T22:30:00Z"));

    render(<AdminVolunteerDuty />);

    expect(screen.getByText("10/01 당일 봉사자")).toBeInTheDocument();
  });
});
