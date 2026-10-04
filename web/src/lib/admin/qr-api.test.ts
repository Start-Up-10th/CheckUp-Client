import {
  AdminUnauthorizedError,
  QrSessionNotFoundError,
  createQrSession,
  heartbeatQrSession,
} from "./qr-api";

const SERVER_BODY = {
  sessionId: "session-1",
  purpose: "DORMITORY",
  qrUrl: "http://localhost:3000/qr#t=" + "a".repeat(43),
  tokenExpiresAt: "2026-09-27T03:15:00Z",
  leaseExpiresAt: "2026-09-27T03:01:00Z",
  serverTime: "2026-09-27T03:00:00Z",
};

function mockFetch(status: number, body?: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createQrSession", () => {
  it("서버의 ISO 시각을 unix ms로 바꾼다", async () => {
    mockFetch(201, SERVER_BODY);

    const session = await createQrSession("dorm");

    expect(session).toEqual({
      sessionId: "session-1",
      qrUrl: SERVER_BODY.qrUrl,
      tokenExpiresAt: Date.UTC(2026, 8, 27, 3, 15),
      serverTime: Date.UTC(2026, 8, 27, 3, 0),
    });
  });

  it("용도를 서버 값으로 바꿔 보낸다", async () => {
    const fetchMock = mockFetch(201, SERVER_BODY);

    await createQrSession("study");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/qr");
    expect(init.credentials).toBe("include");
    expect(JSON.parse(init.body)).toEqual({ purpose: "STUDY_ROOM" });
  });

  it("시각을 읽을 수 없으면 NaN 대신 오류를 낸다", async () => {
    mockFetch(201, { ...SERVER_BODY, serverTime: "not-a-date" });

    await expect(createQrSession("dorm")).rejects.toThrow("invalid serverTime");
  });

  it("401이면 관리자 세션 만료 오류를 낸다", async () => {
    mockFetch(401);

    await expect(createQrSession("dorm")).rejects.toBeInstanceOf(
      AdminUnauthorizedError,
    );
  });

  it("실패 응답은 오류를 낸다", async () => {
    mockFetch(403, {
      code: "ADMIN_ONLY",
      message: "관리자만 사용할 수 있습니다.",
    });

    await expect(createQrSession("dorm")).rejects.toThrow(
      "createQrSession: 403",
    );
  });
});

describe("heartbeatQrSession", () => {
  it("서버의 ISO 시각을 unix ms로 바꾼다", async () => {
    mockFetch(200, SERVER_BODY);

    const heartbeat = await heartbeatQrSession("session-1");

    expect(heartbeat).toEqual({
      qrUrl: SERVER_BODY.qrUrl,
      tokenExpiresAt: Date.UTC(2026, 8, 27, 3, 15),
      serverTime: Date.UTC(2026, 8, 27, 3, 0),
    });
  });

  it("401이면 관리자 세션 만료 오류를 낸다", async () => {
    mockFetch(401);

    await expect(heartbeatQrSession("session-1")).rejects.toBeInstanceOf(
      AdminUnauthorizedError,
    );
  });

  it("404면 세션 없음 오류를 낸다", async () => {
    mockFetch(404, {
      code: "QR_SESSION_NOT_FOUND",
      message: "QR 세션이 없거나 종료되었습니다.",
    });

    await expect(heartbeatQrSession("gone")).rejects.toBeInstanceOf(
      QrSessionNotFoundError,
    );
  });
});
