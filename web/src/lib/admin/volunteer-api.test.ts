import { RateLimitedError } from "./rate-limit";
import { AdminUnauthorizedError } from "./qr-api";
import {
  VolunteerApiError,
  adjustVolunteerCount,
  adjustVolunteerCountBy,
  cancelVolunteerDuty,
  completeVolunteerDuty,
  designateVolunteer,
  fetchVolunteerAdjustments,
  fetchVolunteers,
  toRosterStudent,
} from "./volunteer-api";

const BODY = {
  studentId: 17,
  name: "김도현",
  studentNumber: 2405,
  dormitoryRoom: 412,
  volunteerCount: 3,
  lastActivityAt: "2026-10-01T15:30:00Z",
  todayDuty: "ASSIGNED" as const,
};

function mockFetch(status: number, body?: unknown) {
  const fetchMock = vi.fn().mockImplementation(
    () =>
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

describe("toRosterStudent", () => {
  it("서버 응답을 화면 모델로 바꾼다(학번·호실·한국 날짜·지정 상태)", () => {
    expect(toRosterStudent(BODY)).toEqual({
      id: 17,
      studentId: "2405",
      name: "김도현",
      roomNumber: 412,
      count: 3,
      lastActivityDate: "10/02",
      duty: "designated",
    });
  });

  it("활동 시각과 오늘 지정이 없으면 날짜 없음·지정 없음이다", () => {
    const student = toRosterStudent({
      ...BODY,
      lastActivityAt: null,
      todayDuty: null,
    });

    expect(student.lastActivityDate).toBeUndefined();
    expect(student.duty).toBe("none");
  });

  it("호실이 배정되지 않으면(null) 호실 없음이다", () => {
    expect(
      toRosterStudent({ ...BODY, dormitoryRoom: null }).roomNumber,
    ).toBeNull();
  });

  it("COMPLETED는 완료로 바꾼다", () => {
    expect(toRosterStudent({ ...BODY, todayDuty: "COMPLETED" }).duty).toBe(
      "completed",
    );
  });
});

describe("fetchVolunteers", () => {
  it("명단을 쿠키와 함께 받아 화면 모델 배열로 돌려준다", async () => {
    const fetchMock = mockFetch(200, [BODY]);

    const students = await fetchVolunteers();

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/volunteer", {
      credentials: "include",
    });
    expect(students).toHaveLength(1);
    expect(students[0].id).toBe(17);
  });

  it("401이면 AdminUnauthorizedError다", async () => {
    mockFetch(401);

    await expect(fetchVolunteers()).rejects.toBeInstanceOf(
      AdminUnauthorizedError,
    );
  });

  it("그 밖의 오류는 서버 code를 담은 VolunteerApiError다", async () => {
    mockFetch(409, { code: "NO_VOLUNTEER_LEFT", message: "봉사가 없습니다." });

    await expect(fetchVolunteers()).rejects.toMatchObject({
      status: 409,
      code: "NO_VOLUNTEER_LEFT",
    });
  });

  it("오류 본문이 없으면 code는 null이다", async () => {
    mockFetch(500);

    const error = await fetchVolunteers().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(VolunteerApiError);
    expect((error as VolunteerApiError).code).toBeNull();
  });
});

describe("봉사 변경 요청", () => {
  it("횟수 +1은 PATCH와 Idempotency-Key를 보낸다", async () => {
    const fetchMock = mockFetch(200, BODY);

    await adjustVolunteerCount(17, 1, "key-1");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/volunteer/17/count/increase",
      {
        method: "PATCH",
        headers: { "Idempotency-Key": "key-1" },
        credentials: "include",
      },
    );
  });

  it("횟수 −1은 decrease 경로다", async () => {
    const fetchMock = mockFetch(200, BODY);

    await adjustVolunteerCount(17, -1, "key-2");

    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/v1/volunteer/17/count/decrease",
    );
  });

  it("지정은 POST, 취소는 DELETE, 완료는 POST duty/complete다", async () => {
    const fetchMock = mockFetch(200, BODY);

    await designateVolunteer(17);
    await cancelVolunteerDuty(17);
    await completeVolunteerDuty(17);

    expect(
      fetchMock.mock.calls.map(([url, init]) => [url, init.method]),
    ).toEqual([
      ["/api/v1/volunteer/17/duty", "POST"],
      ["/api/v1/volunteer/17/duty", "DELETE"],
      ["/api/v1/volunteer/17/duty/complete", "POST"],
    ]);
  });

  it("변경 후 서버가 준 학생 상태를 돌려준다", async () => {
    mockFetch(200, { ...BODY, todayDuty: "COMPLETED", volunteerCount: 2 });

    const student = await completeVolunteerDuty(17);

    expect(student.duty).toBe("completed");
    expect(student.count).toBe(2);
  });
});

describe("adjustVolunteerCountBy", () => {
  it("횟수 변화와 사유를 PATCH count로 한 번에 보낸다", async () => {
    const fetchMock = mockFetch(200, BODY);

    await adjustVolunteerCountBy(17, 3, "  청소 당번 대체  ", "key-3");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/volunteer/17/count");
    expect(init.method).toBe("PATCH");
    expect(init.headers).toEqual({
      "Content-Type": "application/json",
      "Idempotency-Key": "key-3",
    });
    expect(JSON.parse(init.body)).toEqual({
      delta: 3,
      reason: "청소 당번 대체",
    });
  });

  it("사유가 비어 있으면 reason을 보내지 않고 100자를 넘으면 자른다", async () => {
    const fetchMock = mockFetch(200, BODY);

    await adjustVolunteerCountBy(17, -2, "   ", "key-4");
    await adjustVolunteerCountBy(17, 1, "가".repeat(120), "key-5");

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ delta: -2 });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).reason).toHaveLength(
      100,
    );
  });

  it("바뀐 학생 상태를 돌려주고 0일 때 차감은 서버 코드로 던진다", async () => {
    mockFetch(200, { ...BODY, volunteerCount: 6 });
    await expect(adjustVolunteerCountBy(17, 3, "")).resolves.toMatchObject({
      count: 6,
    });

    mockFetch(409, { code: "VOLUNTEER_COUNT_ZERO" });
    await expect(adjustVolunteerCountBy(17, -1, "")).rejects.toMatchObject({
      status: 409,
      code: "VOLUNTEER_COUNT_ZERO",
    });
  });
});

describe("fetchVolunteerAdjustments", () => {
  it("조정 이력을 날짜·활동명·실제 바뀐 횟수로 바꾼다", async () => {
    const fetchMock = mockFetch(200, [
      {
        createdAt: "2026-10-01T15:30:00Z",
        delta: -2,
        requestedDelta: -5,
        reason: "청소 당번 대체",
        kind: "ADMIN",
      },
      {
        createdAt: "2026-09-24T01:00:00Z",
        delta: -1,
        reason: null,
        kind: "DUTY_COMPLETION",
      },
      {
        createdAt: "2026-09-17T01:00:00Z",
        delta: 3,
        reason: null,
        kind: "ADMIN",
      },
      { createdAt: "2026-09-03T01:00:00Z", delta: -1, kind: "ADMIN" },
    ]);

    const items = await fetchVolunteerAdjustments(17);

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/volunteer/17/adjustments", {
      credentials: "include",
    });
    expect(items.map(({ date, title, delta }) => [date, title, delta])).toEqual(
      [
        ["10/02", "청소 당번 대체", -2],
        ["09/24", "당일 봉사 완료", -1],
        ["09/17", "봉사 횟수 추가", 3],
        ["09/03", "봉사 횟수 감면", -1],
      ],
    );
    expect(new Set(items.map((item) => item.id)).size).toBe(4);
  });

  it("이력이 없으면 빈 목록이고 401은 로그인 필요 오류다", async () => {
    mockFetch(200, []);
    await expect(fetchVolunteerAdjustments(17)).resolves.toEqual([]);

    mockFetch(401);
    await expect(fetchVolunteerAdjustments(17)).rejects.toBeInstanceOf(
      AdminUnauthorizedError,
    );
  });

  it("횟수가 정수가 아니면 오류를 던진다", async () => {
    mockFetch(200, [{ createdAt: "2026-10-01T00:00:00Z", delta: "x" }]);

    await expect(fetchVolunteerAdjustments(17)).rejects.toThrow("unexpected");
  });
});

describe("429 응답", () => {
  it("봉사 API가 429면 Retry-After를 담은 RateLimitedError다", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(null, { status: 429, headers: { "Retry-After": "7" } }),
        ),
    );

    const error = await fetchVolunteers().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(RateLimitedError);
    expect((error as RateLimitedError).retryAfterMs).toBe(7000);
  });
});
