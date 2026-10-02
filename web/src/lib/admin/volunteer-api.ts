import { AdminUnauthorizedError } from "@/lib/admin/qr-api";
import type { DutyStatus, RosterStudent } from "@/lib/admin/volunteer-types";

/** 서버 봉사 API 응답 한 건(`VolunteerResponse`). 시각은 ISO-8601 문자열이다. */
export type VolunteerApiResponse = {
  studentId: number;
  name: string;
  studentNumber: number;
  dormitoryRoom: number;
  volunteerCount: number;
  lastActivityAt?: string | null;
  todayDuty?: "ASSIGNED" | "COMPLETED" | null;
};

/** 서버가 준 오류. `code`는 서버 ErrorCode 이름(예: `NO_VOLUNTEER_LEFT`)이고 본문이 없으면 null이다. */
export class VolunteerApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | null,
  ) {
    super(`volunteer api: ${status} ${code ?? ""}`.trim());
  }
}

const DUTY_FROM_API: Record<"ASSIGNED" | "COMPLETED", DutyStatus> = {
  ASSIGNED: "designated",
  COMPLETED: "completed",
};

const MONTH_DAY = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "2-digit",
  day: "2-digit",
});

/** 마지막 활동 시각을 한국 날짜 `MM/DD`로 바꾼다. 없거나 읽을 수 없으면 undefined(화면은 `-`). */
function toMonthDay(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  const parts = MONTH_DAY.formatToParts(date);
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return month && day ? `${month}/${day}` : undefined;
}

export function toRosterStudent(body: VolunteerApiResponse): RosterStudent {
  return {
    id: body.studentId,
    studentId: String(body.studentNumber),
    name: body.name,
    roomNumber: body.dormitoryRoom,
    count: body.volunteerCount,
    lastActivityDate: toMonthDay(body.lastActivityAt),
    duty: body.todayDuty ? DUTY_FROM_API[body.todayDuty] : "none",
  };
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`/api/v1/volunteer${path}`, {
    ...init,
    credentials: "include",
  });
  if (res.status === 401) throw new AdminUnauthorizedError();
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      code?: unknown;
    } | null;
    throw new VolunteerApiError(
      res.status,
      typeof body?.code === "string" ? body.code : null,
    );
  }
  return res;
}

async function requestStudent(
  path: string,
  init?: RequestInit,
): Promise<RosterStudent> {
  const res = await request(path, init);
  return toRosterStudent((await res.json()) as VolunteerApiResponse);
}

/** 전체 학생을 호실순으로 가져온다. 검색·층 거르기는 화면에서 하고 서버 필터는 쓰지 않는다. */
export async function fetchVolunteers(): Promise<RosterStudent[]> {
  const res = await request("");
  const body = (await res.json()) as VolunteerApiResponse[];
  return body.map(toRosterStudent);
}

/** 같은 키로 재시도하면 서버가 한 번만 반영한다. 호출마다 새 키를 쓴다. */
export function adjustVolunteerCount(
  id: number,
  delta: 1 | -1,
  idempotencyKey: string = crypto.randomUUID(),
): Promise<RosterStudent> {
  const direction = delta === 1 ? "increase" : "decrease";
  return requestStudent(`/${id}/count/${direction}`, {
    method: "PATCH",
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

export function designateVolunteer(id: number): Promise<RosterStudent> {
  return requestStudent(`/${id}/duty`, { method: "POST" });
}

export function cancelVolunteerDuty(id: number): Promise<RosterStudent> {
  return requestStudent(`/${id}/duty`, { method: "DELETE" });
}

export function completeVolunteerDuty(id: number): Promise<RosterStudent> {
  return requestStudent(`/${id}/duty/complete`, { method: "POST" });
}
