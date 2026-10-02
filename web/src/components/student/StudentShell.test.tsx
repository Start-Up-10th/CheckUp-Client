import { render, screen, waitFor, within } from "@testing-library/react";
import { MainHeader } from "./MainHeader";
import { StudentShell } from "./StudentShell";

const { pathname } = vi.hoisted(() => ({ pathname: { current: "/main" } }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => pathname.current,
}));

function mockUnread(status: number, body?: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function renderHome() {
  render(
    <StudentShell>
      <MainHeader name="김도현" studentNumber="2405" floor={4} />
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

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    expect(screen.queryByText(/읽지 않은 알림 있음/)).not.toBeInTheDocument();
    expect(homeBell()).toHaveAccessibleName("알림");
  });

  it.each([401, 403, 500])(
    "조회가 실패하면(%i) 표시하지 않는다",
    async (status) => {
      const fetchMock = mockUnread(status);
      renderHome();

      await waitFor(() => expect(fetchMock).toHaveBeenCalled());

      expect(screen.queryByText(/읽지 않은 알림 있음/)).not.toBeInTheDocument();
      expect(homeBell()).toHaveAccessibleName("알림");
    },
  );

  it("알림 화면에서는 서버에 묻지 않고 표시하지 않는다", () => {
    pathname.current = "/notifications";
    const fetchMock = mockUnread(200, { hasUnread: true });
    render(<StudentShell showTabBar={false}>알림 목록</StudentShell>);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByText(/읽지 않은 알림 있음/)).not.toBeInTheDocument();
  });
});
