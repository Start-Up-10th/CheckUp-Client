import type { RoomMate } from "@/components/student/RoomMap";

/** 로그인이 필요하다(401). */
export class RoomLoginRequiredError extends Error {
  constructor() {
    super("login required");
  }
}

/** 이름순(같으면 학번순) — 관리자 호실 상세(sortedRoomStudents)와 같은 기준이라 번호가 서로 맞는다. */
export function sortRoomMates(mates: RoomMate[]): RoomMate[] {
  return [...mates].sort(
    (a, b) => a.name.localeCompare(b.name, "ko") || a.id.localeCompare(b.id),
  );
}

function toRoomMate(item: unknown): RoomMate {
  const { student_name, student_number, attended } = (item ?? {}) as Record<
    string,
    unknown
  >;
  if (typeof student_name !== "string" || !Number.isInteger(student_number)) {
    throw new Error("roomRoster: unexpected response");
  }
  return {
    id: String(student_number),
    name: student_name,
    present: attended === true,
  };
}

/**
 * REQ-UI-003: `GET /api/v1/room/student?dormitoryRoom=&purpose=DORMITORY`로 본인 호실 학생 명단과 오늘
 * 기숙사 입소 출석 여부를 받는다(CheckUp-server#101). 학생은 서버가 본인 호실만 허락한다. 학생 홈은 기숙사
 * 입소 출석으로 보여 준다(사용자 결정 2026-10-04). 이름순(같으면 학번순)으로 정렬해 돌려준다.
 * 로그인 안 됨(401)은 전용 오류, 그 밖의 실패(다른 호실 403·서버 오류)와 계약과 다른 응답은 오류로 던진다.
 */
export async function fetchMyRoomMates(
  dormitoryRoom: string,
): Promise<RoomMate[]> {
  const query = new URLSearchParams({ dormitoryRoom, purpose: "DORMITORY" });
  const res = await fetch(`/api/v1/room/student?${query}`, {
    credentials: "include",
  });
  if (res.status === 401) throw new RoomLoginRequiredError();
  if (!res.ok) throw new Error(`roomRoster: ${res.status}`);
  const body = (await res.json()) as unknown;
  if (!Array.isArray(body)) throw new Error("roomRoster: unexpected response");
  return sortRoomMates(body.map(toRoomMate));
}
