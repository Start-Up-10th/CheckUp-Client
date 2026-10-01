import { act, render, screen } from "@testing-library/react";
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
