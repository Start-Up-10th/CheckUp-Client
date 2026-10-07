import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StudentNotifications } from "./StudentNotifications";

// 실제 Next처럼 렌더마다 같은 router를 돌려준다(새 객체를 주면 화면이 목록을 계속 다시 불러온다).
const { replace, router } = vi.hoisted(() => {
  const replace = vi.fn();
  return { replace, router: { replace, push: vi.fn() } };
});
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/notifications",
}));

const LIST = {
  hasUnread: true,
  notifications: [
    {
      id: 2,
      type: "VOLUNTEER",
      message: "봉사 활동이 등록되었습니다",
      createdAt: "2026-10-01T06:40:00Z",
      read: false,
    },
    {
      id: 1,
      type: "ATTENDANCE",
      message: "출석이 완료되었습니다",
      createdAt: "2026-09-29T23:12:00Z",
      read: true,
    },
  ],
};

/** 목록 조회 응답을 차례로 돌려주고, 전체 읽음은 `readStatus`로 답한다. */
function mockApi(
  lists: { status: number; body?: unknown }[],
  readStatus = 204,
) {
  const queue = [...lists];
  const fetchMock = vi.fn(async (...[url]: [string, RequestInit?]) => {
    // 공통 틀의 본인 정보·읽지 않은 알림 조회는 목록 응답과 따로 답한다.
    if (url === "/api/v1/auth/me") return new Response(null, { status: 401 });
    if (url === "/api/v1/notifications/unread") {
      return new Response(JSON.stringify({ hasUnread: false }));
    }
    if (url === "/api/v1/notifications/read") {
      return new Response(null, { status: readStatus });
    }
    const next = queue.shift() ?? { status: 500 };
    return new Response(
      next.body === undefined ? null : JSON.stringify(next.body),
      { status: next.status },
    );
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function readCalls(fetchMock: ReturnType<typeof mockApi>) {
  return fetchMock.mock.calls.filter(
    ([url]) => url === "/api/v1/notifications/read",
  );
}

beforeEach(() => {
  // 한국 시각 2026-10-02(금) 15:00
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-02T06:00:00Z"));
});

afterEach(() => {
  replace.mockReset();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("StudentNotifications", () => {
  it("불러오는 동안 스켈레톤을 보여 준다", () => {
    mockApi([{ status: 200, body: LIST }]);
    render(<StudentNotifications />);

    expect(
      screen.getByRole("status", { name: "알림을 불러오는 중" }),
    ).toBeInTheDocument();
  });

  it("서버 알림을 문구와 상대 시각으로 받은 순서대로 보여 준다", async () => {
    mockApi([{ status: 200, body: LIST }]);
    render(<StudentNotifications />);

    const items = await screen.findAllByRole("listitem");

    expect(items.map((item) => item.textContent)).toEqual([
      "봉사 활동이 등록되었습니다어제 오후 3:40",
      "출석이 완료되었습니다2일 전",
    ]);
  });

  it("읽지 않은 알림이 있으면 목록을 받은 뒤 전체 읽음을 보낸다", async () => {
    const fetchMock = mockApi([{ status: 200, body: LIST }]);
    render(<StudentNotifications />);

    await waitFor(() => expect(readCalls(fetchMock)).toHaveLength(1));
    expect(readCalls(fetchMock)[0][1]).toMatchObject({ method: "POST" });
  });

  it("읽지 않은 알림이 없으면 전체 읽음을 보내지 않는다", async () => {
    const fetchMock = mockApi([
      { status: 200, body: { ...LIST, hasUnread: false } },
    ]);
    render(<StudentNotifications />);

    await screen.findAllByRole("listitem");

    expect(readCalls(fetchMock)).toHaveLength(0);
  });

  it("전체 읽음이 실패해도 목록은 그대로 보여 준다", async () => {
    const fetchMock = mockApi([{ status: 200, body: LIST }], 500);
    render(<StudentNotifications />);

    await waitFor(() => expect(readCalls(fetchMock)).toHaveLength(1));

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("알림이 없으면 빈 상태를 보여 준다", async () => {
    mockApi([{ status: 200, body: { hasUnread: false, notifications: [] } }]);
    render(<StudentNotifications />);

    expect(await screen.findByText("아직 알림이 없어요")).toBeInTheDocument();
  });

  it("로그인이 안 돼 있으면 로그인 화면으로 간다", async () => {
    mockApi([{ status: 401 }]);
    render(<StudentNotifications />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("429면 잠시 후 다시 시도 안내를 보여 주고, 다시 시도하면 다시 불러온다", async () => {
    mockApi([{ status: 429 }, { status: 200, body: LIST }]);
    render(<StudentNotifications />);

    expect(
      await screen.findByText("잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
    expect(screen.queryByText("불러오지 못했어요")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findAllByRole("listitem")).toHaveLength(2);
  });

  it("불러오지 못하면 오류를 보여 주고, 다시 시도하면 다시 불러온다", async () => {
    mockApi([{ status: 500 }, { status: 200, body: LIST }]);
    render(<StudentNotifications />);

    expect(await screen.findByText("불러오지 못했어요")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByText("불러오지 못했어요")).not.toBeInTheDocument();
  });

  it("학생이 아닌 계정(403)이면 학생 전용 문구를 보여 준다", async () => {
    mockApi([{ status: 403 }]);
    render(<StudentNotifications />);

    expect(
      await screen.findByText("학생 계정만 이용할 수 있어요"),
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
