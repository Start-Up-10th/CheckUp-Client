import type { Floor, Room, Student } from "@/lib/admin/floor-types";
import { RoomApiError } from "@/lib/admin/room-api";
import type { RoomGateway } from "@/lib/admin/room-gateway";

// 성 12개 × 이름 20개로 세 층 전체(약 230명)에서 이름이 겹치지 않게 한다. 2·4글자 이름도 일부 넣었다.
const SURNAMES = [
  "김",
  "이",
  "박",
  "최",
  "정",
  "강",
  "조",
  "윤",
  "장",
  "임",
  "한",
  "오",
];
const GIVEN_NAMES = [
  "도현",
  "서연",
  "지후",
  "민수",
  "유진",
  "소율",
  "지호",
  "하은",
  "태민",
  "서준",
  "지원",
  "은서",
  "동욱",
  "나윤",
  "시우",
  "솔",
  "결",
  "하늘별",
  "예린",
  "준혁",
];
// 성 × 이름의 모든 조합이라 겹치지 않고, 고정 시드로 섞어 이웃한 학생 이름이 비슷하지 않게 한다(매번 같은 순서).
const NAME_POOL = shuffled(
  SURNAMES.flatMap((surname) => GIVEN_NAMES.map((given) => surname + given)),
);

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  let seed = 1;
  for (let i = result.length - 1; i > 0; i -= 1) {
    seed = (seed * 16807) % 2147483647;
    const j = seed % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

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

  /** 지난 날짜는 저장된 기록이 없으므로 날짜와 학생 번호로 출석 여부를 정해 날짜마다 다르게 보이게 한다. */
  function studentsOf(roomNumber: string, date?: string): Student[] {
    const students = rooms.get(roomNumber) ?? [];
    if (!date) return students;
    const seed = Number(date.replaceAll("-", ""));
    return students.map((student) => ({
      ...student,
      present: (Number(student.studentId) + seed) % 4 !== 0,
    }));
  }

  return {
    floor: async (floor, date) => {
      const { start, count } = FLOOR_ROOMS[floor];
      return Array.from({ length: count }, (_, i): Room => {
        const number = String(start + i);
        const students = studentsOf(number, date);
        return {
          number,
          assigned: students.length,
          present: students.filter((student) => student.present).length,
          students: students.map((student) => ({ ...student })),
        };
      });
    },
    students: async (roomNumber, date) =>
      studentsOf(roomNumber, date).map((student) => ({ ...student })),
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
