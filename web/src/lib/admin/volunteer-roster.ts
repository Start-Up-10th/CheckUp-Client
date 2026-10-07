import type { Floor } from "@/lib/admin/floor-types";
import type { RosterStudent } from "@/lib/admin/volunteer-types";

export type RoomGroup = { roomNumber: number; students: RosterStudent[] };

export function floorOf(roomNumber: number): number {
  return Math.floor(roomNumber / 100);
}

/** 화면에 보이는 호실 문구. 호실이 배정되지 않은 학생은 `미배정`이다. */
export function roomLabel(roomNumber: number | null): string {
  return roomNumber === null ? "미배정" : `${roomNumber}호`;
}

/** 호실 → 이름 → 학번 순. 호실이 없는 학생은 맨 뒤다. */
function compareStudents(a: RosterStudent, b: RosterStudent): number {
  const roomA = a.roomNumber ?? Number.POSITIVE_INFINITY;
  const roomB = b.roomNumber ?? Number.POSITIVE_INFINITY;
  if (roomA !== roomB) return roomA < roomB ? -1 : 1;
  return (
    a.name.localeCompare(b.name, "ko") || a.studentId.localeCompare(b.studentId)
  );
}

const CHOSEONG = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];
const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;
const SYLLABLES_PER_CHOSEONG = 588;

function toChoseong(text: string): string {
  return [...text]
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code < HANGUL_START || code > HANGUL_END) return char;
      return CHOSEONG[
        Math.floor((code - HANGUL_START) / SYLLABLES_PER_CHOSEONG)
      ];
    })
    .join("");
}

const ONLY_CHOSEONG = /^[ㄱ-ㅎ]+$/;
const ONLY_DIGITS = /^\d+$/;

/**
 * REQ-COM-001: 검색어 하나로 호실·학번·이름을 찾는다. 숫자는 호실 번호나 학번이 정확히 같은 학생만,
 * 그 밖에는 이름에 포함되거나 초성이 이어서 일치하면 찾는다. 검색의 최종 기준은 서버다.
 */
export function matchesQuery(
  student: RosterStudent,
  rawQuery: string,
): boolean {
  const query = rawQuery.trim();
  if (query === "") return true;
  if (ONLY_DIGITS.test(query)) {
    return (
      student.studentId === query ||
      (student.roomNumber !== null && String(student.roomNumber) === query)
    );
  }
  if (student.name.includes(query)) return true;
  return ONLY_CHOSEONG.test(query) && toChoseong(student.name).includes(query);
}

/**
 * 층 탭과 검색어로 거른 뒤 호실 → 이름 → 학번 순으로 같은 호실끼리 묶는다(REQ-COM-001). 호실이 배정되지 않은
 * 학생은 어느 층에도 속하지 않아 이 목록에 나오지 않는다.
 */
export function groupByRoom(
  students: RosterStudent[],
  filter: { floor: Floor; query: string },
): RoomGroup[] {
  const visible = students
    .filter(
      (student) =>
        student.roomNumber !== null &&
        floorOf(student.roomNumber) === filter.floor &&
        matchesQuery(student, filter.query),
    )
    .sort(compareStudents);

  const groups: RoomGroup[] = [];
  for (const student of visible) {
    const last = groups[groups.length - 1];
    const roomNumber = student.roomNumber as number;
    if (last && last.roomNumber === roomNumber) last.students.push(student);
    else groups.push({ roomNumber, students: [student] });
  }
  return groups;
}

/** 오늘 지정돼 아직 완료하지 않은 학생. 06 화면의 당일 봉사자 목록이다(REQ-COM-006). */
export function designatedToday(students: RosterStudent[]): RosterStudent[] {
  return students
    .filter((student) => student.duty === "designated")
    .sort(compareStudents);
}

export type RosterChange = {
  students: RosterStudent[];
  /** changed가 아니면 students는 입력과 같고 이유만 알려 준다. */
  result:
    | "changed"
    | "not-found"
    | "no-count"
    | "already-designated"
    | "already-completed"
    | "not-designated"
    | "at-minimum";
};

function update(
  students: RosterStudent[],
  studentId: string,
  apply: (student: RosterStudent) => RosterStudent | RosterChange["result"],
): RosterChange {
  const target = students.find((student) => student.studentId === studentId);
  if (!target) return { students, result: "not-found" };
  const next = apply(target);
  if (typeof next === "string") return { students, result: next };
  return {
    students: students.map((student) =>
      student.studentId === studentId ? next : student,
    ),
    result: "changed",
  };
}

/** `+`/`−`로 1회 가감한다. 0 미만은 만들지 않고, 조정 날짜를 남긴다(REQ-COM-002). */
export function adjustCount(
  students: RosterStudent[],
  studentId: string,
  delta: 1 | -1,
  today: string,
): RosterChange {
  return update(students, studentId, (student) =>
    student.count + delta < 0
      ? "at-minimum"
      : { ...student, count: student.count + delta, lastActivityDate: today },
  );
}

/** 오늘 봉사자로 지정한다. 횟수는 바꾸지 않는다. 횟수가 0이면 지정하지 않는다(REQ-COM-006). */
export function designate(
  students: RosterStudent[],
  studentId: string,
): RosterChange {
  return update(students, studentId, (student) => {
    if (student.duty === "designated") return "already-designated";
    if (student.duty === "completed") return "already-completed";
    if (student.count < 1) return "no-count";
    return { ...student, duty: "designated" };
  });
}

/** 지정을 취소한다(`봉사 제외`). 횟수는 바꾸지 않고, 완료한 지정은 취소할 수 없다. */
export function cancelDuty(
  students: RosterStudent[],
  studentId: string,
): RosterChange {
  return update(students, studentId, (student) => {
    if (student.duty === "completed") return "already-completed";
    if (student.duty === "none") return "not-designated";
    return { ...student, duty: "none" };
  });
}

/** 봉사를 완료한다. 지정을 완료로 바꾸고 횟수를 1 줄이며 한 번만 반영한다(REQ-COM-006). */
export function completeDuty(
  students: RosterStudent[],
  studentId: string,
  today: string,
): RosterChange {
  return update(students, studentId, (student) => {
    if (student.duty === "completed") return "already-completed";
    if (student.duty === "none") return "not-designated";
    return {
      ...student,
      duty: "completed",
      count: Math.max(0, student.count - 1),
      lastActivityDate: today,
    };
  });
}

/**
 * 패드 06(Figma 318:376)은 최근 활동을 `9월 12일`로 쓴다. 명단 편집(07)의 `MM/DD`를 그 모양으로 바꾸고,
 * 활동이 없으면 `-`다(REQ-COM-002).
 */
export function lastActivityKorean(label: string | undefined): string {
  if (!label) return "-";
  const match = /^(\d{1,2})\/(\d{1,2})$/.exec(label);
  if (!match) return label;
  return `${Number(match[1])}월 ${Number(match[2])}일`;
}

/** 서버가 돌려준 학생 상태로 명단의 같은 학생(서버 ID)을 바꾼다. 명단에 없으면 그대로 둔다. */
export function replaceStudent(
  students: RosterStudent[],
  updated: RosterStudent,
): RosterStudent[] {
  return students.map((student) =>
    student.id === updated.id ? updated : student,
  );
}
