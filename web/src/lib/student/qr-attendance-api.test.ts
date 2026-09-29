import {
  QrLoginRequiredError,
  QrNotStudentError,
  submitQrAttendance,
} from "./qr-attendance-api";

const TOKEN = "a".repeat(43);

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

describe("submitQrAttendance", () => {
  it("토큰만 담아 세션 쿠키와 함께 보낸다", async () => {
    const fetchMock = mockFetch(200, { result: "APPROVED" });

    await submitQrAttendance(TOKEN);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/qr/attendance");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(JSON.parse(init.body)).toEqual({ token: TOKEN });
  });

  it.each([
    ["APPROVED", "approved"],
    ["DUPLICATE", "duplicate"],
    ["EXPIRED", "expired"],
    ["CLOSED", "closed"],
    ["INVALID", "invalid"],
  ] as const)("200 %s → %s", async (apiResult, expected) => {
    mockFetch(200, { result: apiResult });

    await expect(submitQrAttendance(TOKEN)).resolves.toBe(expected);
  });

  it("200인데 result가 없으면 승인으로 오해하지 않고 invalid", async () => {
    mockFetch(200, {});

    await expect(submitQrAttendance(TOKEN)).resolves.toBe("invalid");
  });

  it("401이면 로그인 필요 오류", async () => {
    mockFetch(401);

    await expect(submitQrAttendance(TOKEN)).rejects.toBeInstanceOf(
      QrLoginRequiredError,
    );
  });

  it("403이면 학생 아님 오류", async () => {
    mockFetch(403, {
      code: "MISSING_STUDENT_INFO",
      message: "학생 정보가 없습니다.",
    });

    await expect(submitQrAttendance(TOKEN)).rejects.toBeInstanceOf(
      QrNotStudentError,
    );
  });

  it("400이면 invalid", async () => {
    mockFetch(400, {
      code: "INVALID_REQUEST",
      message: "요청 값이 올바르지 않습니다.",
    });

    await expect(submitQrAttendance(TOKEN)).resolves.toBe("invalid");
  });

  it("5xx는 판정이 아니라 오류로 올리고 토큰을 메시지에 넣지 않는다", async () => {
    mockFetch(503);

    const error = await submitQrAttendance(TOKEN).catch((e: Error) => e);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).not.toContain(TOKEN);
  });

  it("네트워크 오류는 그대로 오류로 올린다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(submitQrAttendance(TOKEN)).rejects.toBeInstanceOf(TypeError);
  });
});
