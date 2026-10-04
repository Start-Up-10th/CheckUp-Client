import { render, screen, waitFor, within } from "@testing-library/react";
import { MainHeader } from "./MainHeader";
import { StudentShell } from "./StudentShell";

const { pathname } = vi.hoisted(() => ({ pathname: { current: "/main" } }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => pathname.current,
}));

/** 읽지 않은 알림 응답을 정한다. 공통 틀의 본인 정보 조회(`/auth/me`)는 로그인 안 됨으로 답한다. */
function mockUnread(status: number, body?: unknown) {
  const fetchMock = vi.fn(async (...[url]: [string, RequestInit?]) =>
    url === "/api/v1/auth/me"
      ? new Response(null, { status: 401 })
      : new Response(body === undefined ? null : JSON.stringify(body), {
          status,
        }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function unreadCalls(fetchMock: ReturnType<typeof mockUnread>) {
  return fetchMock.mock.calls.filter(
    ([url]) => url === "/api/v1/notifications/unread",
  );
}

function renderHome() {
  render(
    <StudentShell>
      <MainHeader profile={null} />
    </StudentShell>,
  );
}

/** 핸드폰 홈 머리의 종. 사이드바에도 알림 링크가 있어 머리 안에서 찾는다. */
function homeBell() {
  return within(screen.getByRole("banner")).getByRole("link");
}

afterEach(() => {
  pathname.current = "/main";
  vi.unstubAllGlobals();
});

describe("StudentShell 읽지 않은 알림", () => {
  it("서버에 읽지 않은 알림이 있으면 사이드바 종과 홈 종에 표시한다", async () => {
    const fetchMock = mockUnread(200, { hasUnread: true });
    renderHome();

    expect(await screen.findByText(/읽지 않은 알림 있음/)).toBeInTheDocument();
    expect(homeBell()).toHaveAccessibleName("알림 (읽지 않은 알림 있음)");
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/notifications/unread", {
      credentials: "include",
    });
  });

  it("읽지 않은 알림이 없으면 표시하지 않는다", async () => {
    const fetchMock = mockUnread(200, { hasUnread: false });
    renderHome();

    await waitFor(() => expect(unreadCalls(fetchMock)).toHaveLength(1));

    expect(screen.queryByText(/읽지 않은 알림 있음/)).not.toBeInTheDocument();
    expect(homeBell()).toHaveAccessibleName("알림");
  });

  it.each([401, 403, 500])(
    "조회가 실패하면(%i) 표시하지 않는다",
    async (status) => {
      const fetchMock = mockUnread(status);
      renderHome();

      await waitFor(() => expect(unreadCalls(fetchMock)).toHaveLength(1));

      expect(screen.queryByText(/읽지 않은 알림 있음/)).not.toBeInTheDocument();
      expect(homeBell()).toHaveAccessibleName("알림");
    },
  );

  it("알림 화면에서는 서버에 묻지 않고 표시하지 않는다", () => {
    pathname.current = "/notifications";
    const fetchMock = mockUnread(200, { hasUnread: true });
    render(<StudentShell showTabBar={false}>알림 목록</StudentShell>);

    expect(unreadCalls(fetchMock)).toHaveLength(0);
    expect(screen.queryByText(/읽지 않은 알림 있음/)).not.toBeInTheDocument();
  });
});

const ME = {
  name: "김도현",
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

/** 본인 정보 응답을 정한다. 읽지 않은 알림은 없음으로 답한다. */
function mockMe(status: number, body?: unknown) {
  const fetchMock = vi.fn(async (...[url]: [string, RequestInit?]) =>
    url === "/api/v1/auth/me"
      ? new Response(body === undefined ? null : JSON.stringify(body), {
          status,
        })
      : new Response(JSON.stringify({ hasUnread: false })),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** 노트북 사이드바(화면에서는 md 이상에서만 보인다) */
function sidebar() {
  return screen.getByRole("complementary");
}

describe("StudentShell 본인 정보", () => {
  it("서버의 이름·학번·호실을 사이드바 프로필에 보여 준다", async () => {
    const fetchMock = mockMe(200, ME);
    render(<StudentShell>내용</StudentShell>);

    expect(await within(sidebar()).findByText("김도현")).toBeInTheDocument();
    expect(within(sidebar()).getByText("2405 · 412호")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/auth/me", {
      credentials: "include",
    });
  });

  it("호실이 배정되지 않았으면 호실 미배정", async () => {
    mockMe(200, {
      ...ME,
      student: { ...ME.student, dormitoryRoom: null, dormitoryFloor: null },
    });
    render(<StudentShell>내용</StudentShell>);

    expect(
      await within(sidebar()).findByText("2405 · 호실 미배정"),
    ).toBeInTheDocument();
  });

  it.each([
    ["받기 전", null],
    ["로그인 안 됨", 401],
    ["서버 오류", 500],
  ])("%s이면 프로필을 비워 둔다", async (_name, status) => {
    if (status === null) {
      vi.stubGlobal(
        "fetch",
        vi.fn(() => new Promise(() => {})),
      );
    } else {
      mockMe(status);
    }
    render(<StudentShell>내용</StudentShell>);
    await waitFor(() => expect(fetch).toHaveBeenCalled());

    expect(within(sidebar()).queryByText(/·/)).not.toBeInTheDocument();
    expect(within(sidebar()).queryByText("김도현")).not.toBeInTheDocument();
  });
});
