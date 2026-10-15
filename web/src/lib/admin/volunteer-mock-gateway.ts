import { operatingDayKey, operatingDayLabel } from "@/lib/admin/operating-day";
import { MOCK_VOLUNTEER_ROSTER } from "@/lib/admin/mock-volunteer-roster";
import { VolunteerApiError } from "@/lib/admin/volunteer-api";
import type { VolunteerGateway } from "@/lib/admin/volunteer-gateway";
import {
  adjustCount,
  cancelDuty,
  completeDuty,
  designate,
  type RosterChange,
} from "@/lib/admin/volunteer-roster";
import { getRoster } from "@/lib/admin/volunteer-roster-store";
import type { DutyRecord, RosterStudent } from "@/lib/admin/volunteer-types";

/** 막힌 이유를 서버 오류 코드와 상태로 옮긴다(서버 swagger의 409/404 코드와 같다). */
const REFUSAL: Record<
  Exclude<RosterChange["result"], "changed" | "not-found">,
  { status: number; code: string }
> = {
  "already-designated": { status: 409, code: "ALREADY_ON_DUTY" },
  "already-completed": { status: 409, code: "DUTY_ALREADY_COMPLETED" },
  "no-count": { status: 409, code: "NO_VOLUNTEER_LEFT" },
  "not-designated": { status: 404, code: "NOT_ON_DUTY" },
  "at-minimum": { status: 409, code: "VOLUNTEER_COUNT_ZERO" },
};

/** 오늘 운영일에서 `daysAgo`일 전의 `YYYY-MM-DD`. */
function daysAgoKey(daysAgo: number): string {
  const [y, m, d] = operatingDayKey(new Date()).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - daysAgo)).toISOString().slice(0, 10);
}

/** 확인용 지난 기록. 오늘 기준 며칠 전으로 잡아 화면과 테스트가 날짜에 흔들리지 않는다. */
function mockHistory(): Record<string, DutyRecord[]> {
  return {
    [daysAgoKey(1)]: [
      {
        studentId: "3203",
        name: "류하준",
        roomNumber: 302,
        status: "missed",
        adjusted: true,
        addedCount: 1,
        reason: "당일 봉사 미이행",
      },
      { studentId: "3115", name: "서지안", roomNumber: 301, status: "missed" },
      {
        studentId: "2405",
        name: "김도현",
        roomNumber: 412,
        status: "completed",
      },
    ],
    [daysAgoKey(2)]: [
      { studentId: "2408", name: "이지후", roomNumber: 413, status: "missed" },
      {
        studentId: "2417",
        name: "한유진",
        roomNumber: 413,
        status: "completed",
      },
    ],
    [daysAgoKey(3)]: [
      {
        studentId: "2403",
        name: "윤채원",
        roomNumber: 414,
        status: "completed",
      },
    ],
  };
}

/**
 * 서버 대신 화면 안 목업 명단으로 같은 동작을 흉내 낸다. 로그인 없이 보는 확인용 페이지와 화면 테스트가 쓴다.
 * 바뀐 학생 상태만 돌려주고, 저장소에 넣는 일은 화면이 한다(실제 서버와 같다).
 */
export function createMockVolunteerGateway(): VolunteerGateway {
  async function mutate(
    id: number,
    apply: (students: RosterStudent[], studentId: string) => RosterChange,
  ): Promise<RosterStudent> {
    const students = getRoster();
    const target = students.find((student) => student.id === id);
    if (!target) throw new VolunteerApiError(404, "STUDENT_NOT_FOUND");
    const change = apply(students, target.studentId);
    if (change.result === "changed") {
      return change.students.find((student) => student.id === id)!;
    }
    if (change.result === "not-found")
      throw new VolunteerApiError(404, "STUDENT_NOT_FOUND");
    const { status, code } = REFUSAL[change.result];
    throw new VolunteerApiError(status, code);
  }

  return {
    history: {
      month: async (year, month) => {
        const prefix = `${year}-${String(month).padStart(2, "0")}-`;
        const marks: Record<string, number> = {};
        for (const [date, records] of Object.entries(mockHistory())) {
          const missed = records.filter((r) => r.status === "missed").length;
          if (date.startsWith(prefix) && missed > 0) marks[date] = missed;
        }
        return marks;
      },
      day: async (date) => mockHistory()[date] ?? [],
    },
    list: async () => MOCK_VOLUNTEER_ROSTER,
    adjustCount: (id, delta) =>
      mutate(id, (students, studentId) =>
        adjustCount(students, studentId, delta, operatingDayLabel(new Date())),
      ),
    designate: (id) => mutate(id, designate),
    cancelDuty: (id) => mutate(id, cancelDuty),
    completeDuty: (id) =>
      mutate(id, (students, studentId) =>
        completeDuty(students, studentId, operatingDayLabel(new Date())),
      ),
  };
}
