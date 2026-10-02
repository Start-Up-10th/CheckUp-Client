import { operatingDayLabel } from "@/lib/admin/operating-day";
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
import type { RosterStudent } from "@/lib/admin/volunteer-types";

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
