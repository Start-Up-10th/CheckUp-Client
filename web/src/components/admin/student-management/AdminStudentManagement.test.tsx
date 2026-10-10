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
import {
  StudentManagementGatewayProvider,
  type StudentManagementGateway,
} from "@/lib/admin/student-management-gateway";
import { createMockStudentManagementGateway } from "@/lib/admin/student-management-mock-gateway";
import { VolunteerGatewayProvider } from "@/lib/admin/volunteer-gateway";
import { createMockVolunteerGateway } from "@/lib/admin/volunteer-mock-gateway";
import { resetRoster, setRoster } from "@/lib/admin/volunteer-roster-store";
import { AdminStudentManagement } from "./AdminStudentManagement";

const volunteerGateway = createMockVolunteerGateway();

function renderDefaultFloor(
  ui: ReactElement,
  gateway: StudentManagementGateway = createMockStudentManagementGateway(),
) {
  const page = (
    <VolunteerGatewayProvider value={volunteerGateway}>
      {ui}
    </VolunteerGatewayProvider>
  );
  return renderPlain(
    <StudentManagementGatewayProvider value={gateway}>
      {page}
    </StudentManagementGatewayProvider>,
  );
}

/** 목업 4층(412호 등) 명단을 쓰는 테스트가 많아 기본 3층에서 4층 탭을 눌러 둔 화면이다. */
function render(ui: ReactElement, gateway?: StudentManagementGateway) {
  const result = renderDefaultFloor(ui, gateway);
  fireEvent.click(screen.getByRole("button", { name: "4층" }));
  return result;
}

beforeEach(() => setRoster(MOCK_VOLUNTEER_ROSTER));
afterEach(() => {
  cleanup();
  resetRoster();
});

describe("AdminStudentManagement", () => {
  it("처음에는 3층 학생을 호실별로 묶어 보여 준다", () => {
    renderDefaultFloor(<AdminStudentManagement />);

    const room301 = screen.getByRole("region", { name: "301호" });
    expect(within(room301).getByText("백도윤")).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "412호" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3층" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("층 탭을 누르면 그 층의 호실로 바뀐다", () => {
    render(<AdminStudentManagement />);

    fireEvent.click(screen.getByRole("button", { name: "3층" }));

    expect(screen.getByRole("region", { name: "301호" })).toBeInTheDocument();
  });

  it("행에 학번·최근 활동·남은 횟수를 보여 주고 활동이 없으면 -를 쓴다", () => {
    render(<AdminStudentManagement />);

    const row = screen.getByRole("button", { name: "김도현 학생 상세" });
    expect(within(row).getByText("2405")).toBeInTheDocument();
    expect(within(row).getByText("최근 활동 10/01")).toBeInTheDocument();
    expect(within(row).getByText("3회")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "3층" }));
    const noActivity = screen.getByRole("button", { name: "서지안 학생 상세" });
    expect(within(noActivity).getByText("최근 활동 -")).toBeInTheDocument();
  });

  it("검색 결과가 없으면 안내 문구를 보여 준다", () => {
    render(<AdminStudentManagement />);

    fireEvent.change(screen.getByRole("searchbox", { name: "학생 검색" }), {
      target: { value: "없는이름" },
    });

    // 가로 배너가 아니라 공통 빈 상태 화면으로 보인다.
    expect(screen.getByText("아직 데이터가 없어요")).toBeInTheDocument();
    expect(screen.getByText("검색 결과가 없습니다.")).toBeInTheDocument();
  });

  it("학생을 누르면 상세 다이얼로그가 열리고 닫기는 값을 바꾸지 않는다", () => {
    render(<AdminStudentManagement />);

    fireEvent.click(screen.getByRole("button", { name: "김도현 학생 상세" }));
    const dialog = screen.getByRole("dialog", { name: "김도현" });
    expect(within(dialog).getByText("2405 · 412호")).toBeInTheDocument();
    expect(within(dialog).getByText("3회")).toBeInTheDocument();

    fireEvent.click(
      within(dialog).getByRole("button", { name: "봉사 횟수 늘리기" }),
    );
    expect(within(dialog).getByText("4회")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "닫기" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const row = screen.getByRole("button", { name: "김도현 학생 상세" });
    expect(within(row).getByText("3회")).toBeInTheDocument();
  });

  it("횟수는 0 아래로 내려가지 않는다", () => {
    render(<AdminStudentManagement />);
    fireEvent.click(screen.getByRole("button", { name: "3층" }));
    fireEvent.click(screen.getByRole("button", { name: "서지안 학생 상세" }));

    const dialog = screen.getByRole("dialog", { name: "서지안" });
    expect(
      within(dialog).getByRole("button", { name: "봉사 횟수 줄이기" }),
    ).toBeDisabled();
  });

  it("저장하면 횟수를 바꾸고 성공 메시지를 보여 준다", async () => {
    render(<AdminStudentManagement />);

    fireEvent.click(screen.getByRole("button", { name: "김도현 학생 상세" }));
    const dialog = screen.getByRole("dialog", { name: "김도현" });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "봉사 횟수 줄이기" }),
    );
    fireEvent.change(within(dialog).getByLabelText("사유"), {
      target: { value: "특별 감면" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "저장" }));

    expect(
      await screen.findByText("봉사 횟수를 변경했습니다."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const row = screen.getByRole("button", { name: "김도현 학생 상세" });
    expect(within(row).getByText("2회")).toBeInTheDocument();
  });

  it("횟수를 바꾸지 않고 저장하면 서버를 부르지 않고 닫는다", () => {
    const saveCount = vi.fn();
    render(<AdminStudentManagement />, { saveCount });

    fireEvent.click(screen.getByRole("button", { name: "김도현 학생 상세" }));
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(saveCount).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("저장에 실패하면 실패 메시지를 보여 주고 다이얼로그를 유지한다", async () => {
    const saveCount = vi.fn().mockRejectedValue(new Error("fail"));
    render(<AdminStudentManagement />, { saveCount });

    fireEvent.click(screen.getByRole("button", { name: "김도현 학생 상세" }));
    fireEvent.click(screen.getByRole("button", { name: "봉사 횟수 늘리기" }));
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(
      await screen.findByText(
        "봉사 횟수 변경에 실패했습니다. 다시 시도해 주세요.",
      ),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByRole("dialog", { name: "김도현" }),
      ).toBeInTheDocument(),
    );
  });
});
