import { act, cleanup, render, screen } from "@testing-library/react";
import { AdminQrGeneration } from "./AdminQrGeneration";

const redirectToAdminLogin = vi.fn();
vi.mock("@/lib/admin/admin-session", () => ({
  redirectToAdminLogin: () => redirectToAdminLogin(),
}));

const SESSION = {
  sessionId: "session-1",
  purpose: "DORMITORY",
  qrUrl: "http://localhost:3000/qr#t=" + "a".repeat(43),
  tokenExpiresAt: "2099-01-01T00:15:00Z",
  leaseExpiresAt: "2099-01-01T00:01:00Z",
  serverTime: "2099-01-01T00:00:00Z",
};

function json(status: number, body?: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.stubGlobal("navigator", { ...navigator, sendBeacon: vi.fn() });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  redirectToAdminLogin.mockReset();
  vi.unstubAllGlobals();
});

describe("AdminQrGeneration 세션 만료", () => {
  it("QR 발급이 401이면 오류 문구 없이 관리자 로그인으로 보낸다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(401)));

    render(<AdminQrGeneration />);

    await vi.waitFor(() =>
      expect(redirectToAdminLogin).toHaveBeenCalledTimes(1),
    );
    expect(screen.queryByText(/QR 자동 생성에 실패/)).not.toBeInTheDocument();
  });

  it("QR 발급이 서버 오류면 오류 문구를 보이고 로그인으로 보내지 않는다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(500)));

    render(<AdminQrGeneration />);

    expect(await screen.findByText(/QR 자동 생성에 실패/)).toBeInTheDocument();
    expect(redirectToAdminLogin).not.toHaveBeenCalled();
  });

  it("heartbeat가 401이면 관리자 로그인으로 보내고 갱신 실패 문구는 보이지 않는다", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(201, SESSION))
      .mockResolvedValue(json(401));
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminQrGeneration />);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
    });

    await vi.waitFor(() =>
      expect(redirectToAdminLogin).toHaveBeenCalledTimes(1),
    );
    expect(screen.queryByText(/QR 갱신에 실패/)).not.toBeInTheDocument();
  });
});

describe("AdminQrGeneration 갱신 실패·만료", () => {
  const SHORT_SESSION = {
    ...SESSION,
    tokenExpiresAt: "2099-01-01T00:00:30Z",
  };

  it("갱신이 일시적으로 실패하면 기존 QR과 남은 시간을 유지한다", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(201, SESSION))
      .mockResolvedValue(json(500));
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminQrGeneration />);
    await screen.findByText("남은 유효 시간");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
    });

    expect(fetchMock.mock.calls.length).toBeGreaterThan(1);
    expect(screen.getByText("남은 유효 시간")).toBeInTheDocument();
    expect(screen.queryByText(/QR 갱신에 실패/)).not.toBeInTheDocument();
    expect(redirectToAdminLogin).not.toHaveBeenCalled();
  });

  it("카운트다운이 0이 되면 만료 안내를 보이고 만료된 QR은 내린다", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(201, SHORT_SESSION))
      .mockResolvedValue(json(500));
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminQrGeneration />);
    await screen.findByText("남은 유효 시간");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(31_000);
    });

    expect(screen.getByText("유효 시간이 만료되었습니다.")).toBeInTheDocument();
    expect(screen.queryByText("남은 유효 시간")).not.toBeInTheDocument();
  });

  it("만료된 뒤 갱신이 성공하면 새 QR로 돌아온다", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(201, SHORT_SESSION))
      .mockResolvedValueOnce(json(500))
      .mockResolvedValue(
        json(200, {
          qrUrl: SESSION.qrUrl,
          tokenExpiresAt: "2099-01-01T00:15:00Z",
          leaseExpiresAt: SESSION.leaseExpiresAt,
          serverTime: "2099-01-01T00:00:40Z",
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminQrGeneration />);
    await screen.findByText("남은 유효 시간");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(31_000);
    });
    expect(screen.getByText("유효 시간이 만료되었습니다.")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });

    expect(await screen.findByText("남은 유효 시간")).toBeInTheDocument();
    expect(
      screen.queryByText("유효 시간이 만료되었습니다."),
    ).not.toBeInTheDocument();
  });
});

describe("AdminQrGeneration 용도", () => {
  it("용도 탭 없이 기숙사 용도로 QR을 발급한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(201, SESSION));
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminQrGeneration />);
    await screen.findByText("남은 유효 시간");

    expect(screen.queryByRole("button", { name: "자습실" })).toBeNull();
    expect(screen.queryByRole("button", { name: "기숙사" })).toBeNull();
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body as string)).toEqual({ purpose: "DORMITORY" });
  });
});
