import { RateLimitedError } from "@/lib/rate-limit";
import {
  VolunteerLoginRequiredError,
  fetchRemainingVolunteerCount,
  fetchVolunteerHistory,
  toVolunteerDateLabel,
} from "./volunteer-api";

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

describe("toVolunteerDateLabel", () => {
  it.each([
    ["2026-10-03", "10월 3일 (토)"],
    ["2026-09-12", "9월 12일 (토)"],
    ["2026-01-05", "1월 5일 (월)"],
  ])("%s → %s", (day, label) => {
    expect(toVolunteerDateLabel(day)).toBe(label);
  });

  it("읽을 수 없으면 원문 그대로", () => {
    expect(toVolunteerDateLabel("어제")).toBe("어제");
  });
});

describe("fetchRemainingVolunteerCount", () => {
  it("본인 학생 id로 세션 쿠키와 함께 남은 횟수를 받는다", async () => {
    const fetchMock = mockFetch(200, { studentId: 1234, volunteerCount: 2 });

    await expect(fetchRemainingVolunteerCount(1234)).resolves.toBe(2);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/users/1234/volunteer");
    expect(init.credentials).toBe("include");
  });

  it("로그인하지 않았으면(401) 로그인 필요 오류", async () => {
    mockFetch(401);

    await expect(fetchRemainingVolunteerCount(1234)).rejects.toBeInstanceOf(
      VolunteerLoginRequiredError,
    );
  });

  it.each([403, 404, 500])("%i는 일반 오류", async (status) => {
    mockFetch(status);

    await expect(fetchRemainingVolunteerCount(1234)).rejects.toThrow(
      `volunteerCount: ${status}`,
    );
  });

  it("횟수가 없으면 오류", async () => {
    mockFetch(200, { studentId: 1234 });

    await expect(fetchRemainingVolunteerCount(1234)).rejects.toThrow(
      "unexpected response",
    );
  });
});

describe("fetchVolunteerHistory", () => {
  it("완료 내역을 받은 순서(최신순)대로 날짜(요일)·1회로 돌려준다", async () => {
    const fetchMock = mockFetch(200, {
      studentId: 1234,
      history: [
        { operatingDay: "2026-10-03", completedAt: "2026-10-03T09:00:00Z" },
        { operatingDay: "2026-09-30", completedAt: "2026-09-30T10:12:00Z" },
      ],
    });

    await expect(fetchVolunteerHistory(1234)).resolves.toEqual([
      { id: "2026-10-03", dateLabel: "10월 3일 (토)", count: 1 },
      { id: "2026-09-30", dateLabel: "9월 30일 (수)", count: 1 },
    ]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/users/1234/volunteer/history");
    expect(init.credentials).toBe("include");
  });

  it("내역이 없으면 빈 목록", async () => {
    mockFetch(200, { studentId: 1234, history: [] });

    await expect(fetchVolunteerHistory(1234)).resolves.toEqual([]);
  });

  it("로그인하지 않았으면(401) 로그인 필요 오류", async () => {
    mockFetch(401);

    await expect(fetchVolunteerHistory(1234)).rejects.toBeInstanceOf(
      VolunteerLoginRequiredError,
    );
  });

  it.each([
    ["목록 없음", { studentId: 1234 }],
    ["날짜 없음", { studentId: 1234, history: [{}] }],
  ])("응답이 계약과 다르면 오류(%s)", async (_name, body) => {
    mockFetch(200, body);

    await expect(fetchVolunteerHistory(1234)).rejects.toThrow(
      "unexpected response",
    );
  });
});

describe("429 응답", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("429면 Retry-After를 담은 RateLimitedError다", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation(
          async () =>
            new Response(null, {
              status: 429,
              headers: { "Retry-After": "3" },
            }),
        ),
    );

    const error = await fetchRemainingVolunteerCount(7).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(RateLimitedError);
    expect((error as RateLimitedError).retryAfterMs).toBe(3000);
  });
});
