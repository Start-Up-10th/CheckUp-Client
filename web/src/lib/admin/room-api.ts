import { AdminUnauthorizedError } from "@/lib/admin/qr-api";
import { throwIfRateLimited } from "@/lib/rate-limit";
import { withAllRooms } from "@/lib/admin/floor-rooms";
import type { Floor, Room, Student } from "@/lib/admin/floor-types";

/** 서버가 준 오류. `code`는 서버 ErrorCode 이름(예: `STUDENT_NOT_IN_ROOM`)이고 본문이 없으면 null이다. */
export class RoomApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | null,
  ) {
    super(`room api: ${status} ${code ?? ""}`.trim());
  }
}

/** 한 번에 저장할 수 있는 학생 수(서버 `RoomAttendanceRequest.students`는 최대 50명). */
const MAX_STUDENTS_PER_SAVE = 50;

type FloorApiBody = {
  rooms?: Array<{
    dormitoryRoom?: unknown;
    attended?: unknown;
    assigned?: unknown;
  }>;
};

type RoomStudentApiBody = {
  student_id?: unknown;
  student_name?: unknown;
  attended?: unknown;
};

async function request(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`/api/v1/room${path}`, {
    ...init,
    credentials: "include",
  });
  if (res.status === 401) throw new AdminUnauthorizedError();
  throwIfRateLimited(res);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      code?: unknown;
    } | null;
    throw new RoomApiError(
      res.status,
      typeof body?.code === "string" ? body.code : null,
    );
  }
  return res;
}

const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

/**
 * `GET /api/v1/room/floor`: 한 층의 호실별 배정·출석 인원(기숙사, 호실 번호 오름차순).
 * 배정된 학생이 없는 호실은 서버가 주지 않으므로 이 층의 모든 호실을 합쳐 돌려준다(등록하지 않은 호실은 0/0, DEC-059).
 * 응답이 계약과 다르면 오류를 던진다.
 */
export async function fetchFloorRooms(floor: Floor): Promise<Room[]> {
  const res = await request(`/floor?floor=${floor}&purpose=DORMITORY`);
  const body = (await res.json()) as FloorApiBody;
  if (!Array.isArray(body.rooms)) throw new Error("room floor: unexpected");
  const rooms = body.rooms.map((room) => {
    if (
      !isCount(room.dormitoryRoom) ||
      !isCount(room.attended) ||
      !isCount(room.assigned)
    ) {
      throw new Error("room floor: unexpected room");
    }
    return {
      number: String(room.dormitoryRoom),
      assigned: room.assigned,
      present: Math.min(room.attended, room.assigned),
    };
  });
  return withAllRooms(floor, rooms);
}

/** `GET /api/v1/room/attendance`: 호실 학생 명단과 오늘 기숙사 출석 여부. */
export async function fetchRoomStudents(
  roomNumber: string,
): Promise<Student[]> {
  const res = await request(
    `/attendance?dormitoryRoom=${encodeURIComponent(roomNumber)}`,
  );
  const body = (await res.json()) as RoomStudentApiBody[];
  if (!Array.isArray(body)) throw new Error("room students: unexpected");
  return body.map((student) => {
    if (
      typeof student.student_id !== "number" ||
      typeof student.student_name !== "string" ||
      typeof student.attended !== "boolean"
    ) {
      throw new Error("room students: unexpected student");
    }
    return {
      studentId: String(student.student_id),
      name: student.student_name,
      present: student.attended,
    };
  });
}

/**
 * `PUT /api/v1/room/{호실}/attendance`: 바뀐 학생의 출석 상태를 저장한다(성공 204). 서버는 호실 학생이 아닌 학생이
 * 하나라도 있으면 400 STUDENT_NOT_IN_ROOM으로 아무것도 저장하지 않는다. 50명을 넘으면 나눠 보낸다.
 */
export async function saveRoomAttendance(
  roomNumber: string,
  changes: Array<{ studentId: string; present: boolean }>,
): Promise<void> {
  for (let start = 0; start < changes.length; start += MAX_STUDENTS_PER_SAVE) {
    const chunk = changes.slice(start, start + MAX_STUDENTS_PER_SAVE);
    await request(
      `/${encodeURIComponent(roomNumber)}/attendance?purpose=DORMITORY`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          students: chunk.map((change) => ({
            studentId: Number(change.studentId),
            attended: change.present,
          })),
        }),
      },
    );
  }
}
