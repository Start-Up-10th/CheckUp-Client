import { AdminUnauthorizedError } from "./qr-api";
import {
  VolunteerApiError,
  adjustVolunteerCount,
  cancelVolunteerDuty,
  completeVolunteerDuty,
  designateVolunteer,
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
