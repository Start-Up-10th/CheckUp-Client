import { RateLimitedError } from "@/lib/rate-limit";
import { fetchAttendanceActive } from "./attendance-active-api";

function mockFetch(status: number, body?: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchAttendanceActive", () => {
  it("세션 쿠키와 함께 조회하고 용도별 여부를 돌려준다", async () => {
    const fetchMock = mockFetch(200, { dormitory: true, studyRoom: false });

    await expect(fetchAttendanceActive()).resolves.toEqual({
      dormitory: true,
      studyRoom: false,
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/attendance/active");
    expect(init.credentials).toBe("include");
  });

  it("계약과 다른 응답은 오류로 던진다", async () => {
    mockFetch(200, { dormitory: "yes" });

    await expect(fetchAttendanceActive()).rejects.toThrow(
      "attendanceActive: unexpected response",
    );
  });

  it("429는 RateLimitedError, 그 밖의 실패는 오류로 던진다", async () => {
    mockFetch(429);
    await expect(fetchAttendanceActive()).rejects.toBeInstanceOf(
      RateLimitedError,
    );

    mockFetch(403);
    await expect(fetchAttendanceActive()).rejects.toThrow(
      "attendanceActive: 403",
    );
  });
});
