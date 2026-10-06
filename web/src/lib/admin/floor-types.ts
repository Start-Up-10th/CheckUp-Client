export type Floor = 3 | 4 | 5;

export type Student = {
  /** 서버 학생 ID(DataGSM 학생 id)를 문자열로 둔 값. 화면 키와 수동 출석 저장 요청에 쓴다. */
  studentId: string;
  name: string;
  present: boolean;
};

/** 전개도 호실 카드 한 칸. 서버 층 현황이 주는 호실별 배정·출석 인원이다. 학생 명단은 호실을 열 때 따로 받는다. */
export type Room = {
  number: string;
  assigned: number;
  present: number;
};

export function roomAttendance(room: Room) {
  return { assigned: room.assigned, present: room.present };
}

/** 호실 학생 명단의 배정·출석 인원. 수정 다이얼로그가 저장 전 선택을 바로 세는 데 쓴다. */
export function studentsAttendance(students: Student[]) {
  return {
    assigned: students.length,
    present: students.filter((student) => student.present).length,
  };
}

export function summarizeAttendance(rooms: Room[]) {
  return rooms.reduce(
    (totals, room) => ({
      present: totals.present + room.present,
      absent: totals.absent + (room.assigned - room.present),
    }),
    { present: 0, absent: 0 },
  );
}

/** REQ-UI-002: 이름순, 동명이인은 학생 ID로 안정 정렬한다. */
export function sortedRoomStudents(students: Student[]): Student[] {
  return [...students].sort(
    (a, b) =>
      a.name.localeCompare(b.name, "ko") ||
      a.studentId.localeCompare(b.studentId, undefined, { numeric: true }),
  );
}
