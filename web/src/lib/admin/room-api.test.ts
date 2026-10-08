import { afterEach, describe, expect, it, vi } from "vitest";
import { RateLimitedError } from "@/lib/rate-limit";
import { AdminUnauthorizedError } from "@/lib/admin/qr-api";
import {
  fetchFloorRooms,
  fetchRoomStudents,
  RoomApiError,
  saveRoomAttendance,
} from "./room-api";

function respond(status: number, body?: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("fetchFloorRooms", () => {
  it("층 현황을 호실 카드 값으로 바꾼다", async () => {
    const fetchMock = respond(200, {
      floor: 4,
      attended: 5,
      absent: 3,
      rooms: [
        { dormitoryRoom: 401, attended: 3, assigned: 4 },
        { dormitoryRoom: 402, attended: 2, assigned: 4 },
      ],
    });

    const rooms = await fetchFloorRooms(4);

    expect(rooms.slice(0, 3)).toEqual([
      { number: "401", assigned: 4, present: 3 },
      { number: "402", assigned: 4, present: 2 },
      { number: "403", assigned: 0, present: 0 },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/room/floor?floor=4&purpose=DORMITORY",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("출석이 배정보다 많게 와도 배정을 넘기지 않는다", async () => {
    respond(200, { rooms: [{ dormitoryRoom: 301, attended: 9, assigned: 4 }] });

    const rooms = await fetchFloorRooms(3);

    expect(rooms[0]).toEqual({ number: "301", assigned: 4, present: 4 });
  });

  it("등록한 학생이 없어 서버가 호실을 주지 않아도 이 층의 모든 호실을 0/0으로 돌려준다", async () => {
    respond(200, { rooms: [] });

    const rooms = await fetchFloorRooms(5);

    expect(rooms).toHaveLength(18);
    expect(rooms[0]).toEqual({ number: "501", assigned: 0, present: 0 });
    expect(rooms.at(-1)).toEqual({ number: "518", assigned: 0, present: 0 });
  });

  it("응답이 계약과 다르면 오류를 던진다", async () => {
    respond(200, { rooms: [{ dormitoryRoom: "x" }] });

    await expect(fetchFloorRooms(4)).rejects.toThrow("unexpected");
  });

  it("401이면 관리자 로그인이 필요하다는 오류다", async () => {
    respond(401);

    await expect(fetchFloorRooms(4)).rejects.toBeInstanceOf(
      AdminUnauthorizedError,
    );
  });
});

describe("fetchRoomStudents", () => {
  it("명단을 학생 ID·이름·출석 여부로 바꾼다", async () => {
    const fetchMock = respond(200, [
      {
        student_id: 11,
        student_name: "김도현",
        student_class: 4,
        student_number: 2405,
        attended: true,
      },
      { student_id: 12, student_name: "박서연", attended: false },
    ]);

    await expect(fetchRoomStudents("401")).resolves.toEqual([
      { studentId: "11", name: "김도현", present: true },
      { studentId: "12", name: "박서연", present: false },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/room/attendance?dormitoryRoom=401",
      expect.anything(),
    );
  });

  it("학생 ID가 없는 항목이 있으면 오류를 던진다", async () => {
    respond(200, [{ student_name: "김도현", attended: true }]);

    await expect(fetchRoomStudents("401")).rejects.toThrow("unexpected");
  });
});

describe("saveRoomAttendance", () => {
  it("바뀐 학생만 숫자 ID로 PUT한다", async () => {
    const fetchMock = respond(204);

    await saveRoomAttendance("401", [
      { studentId: "11", present: false },
      { studentId: "12", present: true },
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/room/401/attendance?purpose=DORMITORY");
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body)).toEqual({
      students: [
        { studentId: 11, attended: false },
        { studentId: 12, attended: true },
      ],
    });
  });

  it("50명을 넘으면 나눠 보낸다", async () => {
    const fetchMock = respond(204);
    const changes = Array.from({ length: 51 }, (_, i) => ({
      studentId: String(i + 1),
      present: true,
    }));

    await saveRoomAttendance("401", changes);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).students).toHaveLength(
      50,
    );
  });

  it("서버가 막으면 오류 코드를 담아 던진다", async () => {
    respond(400, { code: "STUDENT_NOT_IN_ROOM" });

    await expect(
      saveRoomAttendance("401", [{ studentId: "99", present: true }]),
    ).rejects.toMatchObject({
      status: 400,
      code: "STUDENT_NOT_IN_ROOM",
    } satisfies Partial<RoomApiError>);
  });
});

describe("429 응답", () => {
  it("호실 API가 429면 Retry-After를 담은 RateLimitedError다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ "Retry-After": "2" }),
        json: async () => ({}),
      }),
    );

    const error = await fetchFloorRooms(4).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(RateLimitedError);
    expect((error as RateLimitedError).retryAfterMs).toBe(2000);
  });
});
