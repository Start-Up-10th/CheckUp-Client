import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StudentVolunteer } from "./StudentVolunteer";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => {
  const router = { replace, push: vi.fn() };
  return { useRouter: () => router, usePathname: () => "/volunteer" };
});

const ME = {
  name: "홍길동",
  role: "STUDENT",
  consented: true,
  student: {
    studentId: 1234,
    grade: 2,
    classNumber: 4,
    number: 5,
    studentNumber: 2405,
    dormitoryRoom: 412,
    dormitoryFloor: 4,
  },
};

const HISTORY = {
  studentId: 1234,
  history: [
    { operatingDay: "2026-10-03", completedAt: "2026-10-03T09:00:00Z" },
    { operatingDay: "2026-09-30", completedAt: "2026-09-30T10:12:00Z" },
  ],
};

type Reply = { status: number; body?: unknown };
const toResponse = ({ status, body }: Reply) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

/** 본인 정보·남은 횟수·완료 내역 응답을 정한다. 내역 응답은 부를 때마다 차례로 쓴다. */
function mockApi({
  me = { status: 200, body: ME },
  count = { status: 200, body: { studentId: 1234, volunteerCount: 2 } },
  history = [{ status: 200, body: HISTORY }],
}: { me?: Reply; count?: Reply; history?: Reply[] } = {}) {
  const queue = [...history];
  const fetchMock = vi.fn(async (...[url]: [string, RequestInit?]) => {
    if (url === "/api/v1/auth/me") return toResponse(me);
    if (url === "/api/v1/users/1234/volunteer") return toResponse(count);
    if (url === "/api/v1/users/1234/volunteer/history") {
      return toResponse(queue.shift() ?? { status: 500 });
    }
    return new Response(JSON.stringify({ hasUnread: false }));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  replace.mockReset();
  vi.unstubAllGlobals();
});

describe("StudentVolunteer", () => {
  it("불러오는 동안 스켈레톤을 보여 준다", () => {
    mockApi();
    render(<StudentVolunteer />);

    expect(
      screen.getByRole("status", { name: "봉사 활동을 불러오는 중" }),
    ).toBeInTheDocument();
  });

  it("남은 봉사 횟수와 완료 내역을 최신순 날짜(요일)·1회로 보여 준다", async () => {
    mockApi();
    render(<StudentVolunteer />);

    expect(await screen.findByText("남은 봉사 횟수")).toBeInTheDocument();
    expect(screen.getByText("2회")).toBeInTheDocument();
    expect(
      screen.getAllByRole("listitem").map((item) => item.textContent),
    ).toEqual(["10월 3일 (토)1회", "9월 30일 (수)1회"]);
  });

  it("내역이 없어도 남은 횟수는 보이고 목록 자리에 빈 상태를 보여 준다", async () => {
    mockApi({
      history: [{ status: 200, body: { studentId: 1234, history: [] } }],
    });
    render(<StudentVolunteer />);

    expect(
      await screen.findByText("아직 봉사 활동 기록이 없어요"),
    ).toBeInTheDocument();
    expect(screen.getByText("2회")).toBeInTheDocument();
  });

  it("불러오지 못하면 오류를 보여 주고, 다시 시도하면 다시 불러온다", async () => {
    mockApi({ history: [{ status: 500 }, { status: 200, body: HISTORY }] });
    render(<StudentVolunteer />);

    expect(await screen.findByText("불러오지 못했어요")).toBeInTheDocument();
    expect(
      screen.getByText("봉사 활동 내역을 불러오지 못했습니다."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findAllByRole("listitem")).toHaveLength(2);
    expect(
      screen.queryByText("봉사 활동 내역을 불러오지 못했습니다."),
    ).not.toBeInTheDocument();
  });

  it("본인 정보를 받지 못하면 오류를 보여 준다", async () => {
    mockApi({ me: { status: 500 } });
    render(<StudentVolunteer />);

    expect(await screen.findByText("불러오지 못했어요")).toBeInTheDocument();
  });

  it("로그인하지 않았으면 로그인 화면으로 간다", async () => {
    mockApi({ me: { status: 401 } });
    render(<StudentVolunteer />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("봉사 조회가 401이면 로그인 화면으로 간다", async () => {
    mockApi({ count: { status: 401 } });
    render(<StudentVolunteer />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });
});
