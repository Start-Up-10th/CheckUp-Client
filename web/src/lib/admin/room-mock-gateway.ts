import type { Floor, Room, Student } from "@/lib/admin/floor-types";
import { RoomApiError } from "@/lib/admin/room-api";
import type { RoomGateway } from "@/lib/admin/room-gateway";

const NAME_POOL = [
  "김도현",
  "박서연",
  "이지후",
  "정민수",
  "최유진",
  "한소율",
  "윤지호",
  "임하은",
  "강태민",
  "오서준",
  "배지원",
  "조은서",
  "신동욱",
  "권나윤",
  "황시우",
];

const FLOOR_ROOMS: Record<Floor, { start: number; count: number }> = {
  3: { start: 301, count: 20 },
  4: { start: 401, count: 21 },
  5: { start: 501, count: 18 },
};

/**
 * 개발용 호실 데이터. 로그인 없이 보는 확인용 페이지와 화면 테스트만 쓰고 운영에는 쓰지 않는다. 모든 호실은 배정
 * 인원 1명 이상이다(공실 없음). 이름은 실제 학생과 무관한 합성 값이다.
 */
function buildMockRooms(): Map<string, Student[]> {
  const rooms = new Map<string, Student[]>();
  let seq = 0;
  let studentId = 1;
  for (const { start, count } of Object.values(FLOOR_ROOMS)) {
    for (let i = 0; i < count; i += 1) {
      const capacity = i % 7 === 3 ? 3 : 4;
      const absentSeat = i % 5 === 0 ? 0 : -1;
      const students: Student[] = Array.from(
        { length: capacity },
        (_, seat) => {
          const name = NAME_POOL[seq % NAME_POOL.length];
          seq += 1;
          const student: Student = {
            studentId: String(studentId),
            name,
            present: seat !== absentSeat,
          };
          studentId += 1;
          return student;
        },
      );
      rooms.set(String(start + i), students);
    }
  }
  return rooms;
}

/** 서버 대신 메모리의 목업 호실로 같은 동작을 흉내 낸다. 저장하면 이후 조회에 반영된다. */
export function createMockRoomGateway(): RoomGateway {
  const rooms = buildMockRooms();

  function studentsOf(roomNumber: string): Student[] {
    return rooms.get(roomNumber) ?? [];
  }

  return {
    floor: async (floor) => {
      const { start, count } = FLOOR_ROOMS[floor];
      return Array.from({ length: count }, (_, i): Room => {
        const number = String(start + i);
        const students = studentsOf(number);
        return {
          number,
          assigned: students.length,
          present: students.filter((student) => student.present).length,
        };
      });
    },
    students: async (roomNumber) =>
      studentsOf(roomNumber).map((student) => ({ ...student })),
    save: async (roomNumber, changes) => {
      const students = studentsOf(roomNumber);
      if (
        changes.some(
          (change) =>
            !students.some((student) => student.studentId === change.studentId),
        )
      ) {
        throw new RoomApiError(400, "STUDENT_NOT_IN_ROOM");
      }
      rooms.set(
        roomNumber,
        students.map((student) => {
          const change = changes.find(
            (item) => item.studentId === student.studentId,
          );
          return change ? { ...student, present: change.present } : student;
        }),
      );
    },
  };
}
