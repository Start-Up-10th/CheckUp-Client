export type Floor = 3 | 4 | 5;

export type Student = {
  studentId: string;
  name: string;
  present: boolean;
};

export type Room = {
  number: string;
  students: Student[];
};

/**
 * TODO(DEC-002): DataGSM 호실 그룹/배정 API가 확정되면 이 mock을 실제 연동으로 교체한다.
 * 지금은 개발용 데이터이며 운영에는 사용하지 않는다. "빈 방은 없다" 전제에 따라
 * 모든 호실은 배정 인원 1명 이상을 가진다 (공실 케이스를 만들지 않는다). 이름은 실제
 * 학생과 무관한 합성 placeholder다.
 */
export const IS_MOCK_FLOOR_DATA = true;

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

function buildFloorRooms(startNumber: number, count: number): Room[] {
  let seatSeq = 0;
  return Array.from({ length: count }, (_, i) => {
    const number = String(startNumber + i);
    const capacity = i % 7 === 3 ? 3 : 4;
    const absentSeat = i % 5 === 0 ? 0 : -1;

    const students: Student[] = Array.from(
      { length: capacity },
      (_, seatIndex) => {
        const name = NAME_POOL[seatSeq % NAME_POOL.length];
        seatSeq += 1;
        return {
          studentId: `${number}-${seatIndex + 1}`,
          name,
          present: seatIndex !== absentSeat,
        };
      },
    );

    return { number, students };
  });
}

export const MOCK_FLOOR_ROOMS: Record<Floor, Room[]> = {
  3: buildFloorRooms(301, 20),
  4: buildFloorRooms(401, 21),
  5: buildFloorRooms(501, 18),
};

export function roomAttendance(room: Room) {
  const assigned = room.students.length;
  const present = room.students.filter((student) => student.present).length;
  return { assigned, present };
}

export function summarizeAttendance(rooms: Room[]) {
  return rooms.reduce(
    (totals, room) => {
      const { assigned, present } = roomAttendance(room);
      return {
        present: totals.present + present,
        absent: totals.absent + (assigned - present),
      };
    },
    { present: 0, absent: 0 },
  );
}

/** REQ-UI-002: 이름순, 동명이인은 학번(studentId)으로 안정 정렬한다. */
export function sortedRoomStudents(room: Room): Student[] {
  return [...room.students].sort(
    (a, b) =>
      a.name.localeCompare(b.name, "ko") ||
      a.studentId.localeCompare(b.studentId),
  );
}
