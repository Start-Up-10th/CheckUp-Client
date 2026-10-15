import { AdminUnauthorizedError } from "@/lib/admin/qr-api";
import { throwIfRateLimited } from "@/lib/rate-limit";
import type {
  DutyRecord,
  DutyRecordStatus,
  DutyStatus,
  RosterStudent,
} from "@/lib/admin/volunteer-types";

/** 서버 봉사 API 응답 한 건(`VolunteerResponse`). 시각은 ISO-8601 문자열이다. */
export type VolunteerApiResponse = {
  studentId: number;
  name: string;
  studentNumber: number;
  /** 호실. 배정되지 않았으면 null이다. */
  dormitoryRoom: number | null;
  volunteerCount: number;
  lastActivityAt?: string | null;
  todayDuty?: "ASSIGNED" | "COMPLETED" | "MISSED" | null;
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

const DUTY_FROM_API: Record<"ASSIGNED" | "COMPLETED" | "MISSED", DutyStatus> = {
  ASSIGNED: "designated",
  COMPLETED: "completed",
  MISSED: "missed",
};

const RECORD_FROM_API: Record<
  "ASSIGNED" | "COMPLETED" | "MISSED",
  DutyRecordStatus
> = {
  ASSIGNED: "assigned",
  COMPLETED: "completed",
  MISSED: "missed",
};

/** 서버 날짜별 당일 봉사자 기록 한 건(`VolunteerDutyRecordResponse`). */
export type VolunteerDutyRecordApiResponse = {
  studentId: number;
  studentNumber: number;
  name: string;
  dormitoryRoom: number | null;
  status: "ASSIGNED" | "COMPLETED" | "MISSED";
  /** 미이행으로 횟수를 처리했는지. */
  adjusted: boolean;
  /** 미이행으로 실제 바꾼 횟수. 처리 전이면 null이고 음수일 수 있다. */
  addedCount?: number | null;
  reason?: string | null;
};

export function toDutyRecord(body: VolunteerDutyRecordApiResponse): DutyRecord {
  const status = RECORD_FROM_API[body.status];
  if (!status) throw new Error("dutyRecord: unexpected status");
  return {
    id: body.studentId,
    studentId: String(body.studentNumber),
    name: body.name,
    roomNumber: body.dormitoryRoom ?? null,
    status,
    adjusted: body.adjusted === true,
    addedCount: body.addedCount ?? undefined,
    reason: body.reason?.trim() || undefined,
  };
}

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
    roomNumber: body.dormitoryRoom ?? null,
    count: body.volunteerCount,
    lastActivityDate: toMonthDay(body.lastActivityAt),
    duty: body.todayDuty ? DUTY_FROM_API[body.todayDuty] : "none",
  };
}

/** 서버가 받는 사유의 최대 길이(`VolunteerAdjustRequest.reason`). */
const MAX_REASON_LENGTH = 100;

/** 서버 봉사 횟수 조정 이력 한 건(`VolunteerAdjustmentResponse`). */
type VolunteerAdjustmentApiResponse = {
  createdAt?: string | null;
  /** 실제로 바뀐 횟수. 양수는 추가, 음수는 차감(당일 봉사 완료 포함). */
  delta: number;
  reason?: string | null;
  kind?: "ADMIN" | "DUTY_COMPLETION" | "DUTY_MISSED" | null;
};

/** 봉사 이력 한 줄. 날짜는 `MM/DD`, 변화는 실제로 바뀐 횟수(1이 아닐 수 있다)다. */
export type VolunteerAdjustment = {
  id: string;
  date: string;
  title: string;
  delta: number;
};

/** 사유를 남기지 않은 조정의 활동명. 서버가 종류별 기본 문구를 화면이 정하게 한다. */
function adjustmentTitle(item: VolunteerAdjustmentApiResponse): string {
  const reason = item.reason?.trim();
  if (reason) return reason;
  if (item.kind === "DUTY_COMPLETION") return "당일 봉사 완료";
  if (item.kind === "DUTY_MISSED") return "당일 봉사 미이행";
  return item.delta > 0 ? "봉사 횟수 추가" : "봉사 횟수 감면";
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`/api/v1/volunteer${path}`, {
    ...init,
    credentials: "include",
  });
  if (res.status === 401) throw new AdminUnauthorizedError();
  throwIfRateLimited(res);
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

/**
 * 학생 상세에서 정한 횟수 변화(`delta`, 양수 추가·음수 차감, -99~99, 0 제외)와 사유를 한 번에 저장한다
 * (`PATCH /api/v1/volunteer/{id}/count`). 사유는 비어 있으면 보내지 않고 100자까지 보낸다. 같은 키로 재시도하면 서버가
 * 한 번만 반영한다. 호출마다 새 키를 쓴다. 차감은 남은 횟수까지만 되고 0이면 409 `VOLUNTEER_COUNT_ZERO`다.
 */
export function adjustVolunteerCountBy(
  id: number,
  delta: number,
  reason: string,
  idempotencyKey: string = crypto.randomUUID(),
): Promise<RosterStudent> {
  const trimmed = reason.trim().slice(0, MAX_REASON_LENGTH);
  return requestStudent(`/${id}/count`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(trimmed ? { delta, reason: trimmed } : { delta }),
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

/** 미이행 처리에서 서버가 받는 횟수 변화의 크기(`VolunteerMissedRequest.delta`는 -99~99). */
export const MAX_MISSED_DELTA = 99;

/**
 * 오늘 지정을 미이행으로 바꾸고 횟수 변화(`delta`, -99~99, 0이면 횟수는 그대로)와 사유를 한 번에 저장한다
 * (`POST /api/v1/volunteer/{id}/duty/missed`). 지정을 삭제하지 않고 `MISSED`로 남긴다. 같은 키로 재시도하면 서버가
 * 한 번만 반영한다. 지정이 없으면 404 `NOT_ON_DUTY`, 완료했으면 409 `DUTY_ALREADY_COMPLETED`, 횟수를 이미 처리했으면
 * 409 `DUTY_ALREADY_ADJUSTED`다. 학생 알림은 만들거나 지우지 않는다.
 */
export function markVolunteerMissed(
  id: number,
  delta: number,
  reason: string,
  idempotencyKey: string = crypto.randomUUID(),
): Promise<RosterStudent> {
  return requestStudent(`/${id}/duty/missed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(missedBody(delta, reason)),
  });
}

/**
 * 지난 날짜(`date`, `YYYY-MM-DD`)의 지정을 미이행으로 바꾸고 횟수·사유를 저장한다
 * (`PATCH /api/v1/volunteer/duties/{date}/{id}/missed`). 지정됨이거나 횟수를 처리하지 않은 미이행만 된다.
 * 지정이 없으면 404 `DUTY_NOT_FOUND`, 횟수를 이미 처리했으면 409 `DUTY_ALREADY_ADJUSTED`다.
 */
export async function adjustMissedDuty(
  date: string,
  id: number,
  delta: number,
  reason: string,
  idempotencyKey: string = crypto.randomUUID(),
): Promise<DutyRecord> {
  const res = await request(`/duties/${date}/${id}/missed`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(missedBody(delta, reason)),
  });
  return toDutyRecord((await res.json()) as VolunteerDutyRecordApiResponse);
}

function missedBody(delta: number, reason: string) {
  const trimmed = reason.trim().slice(0, MAX_REASON_LENGTH);
  return trimmed ? { delta, reason: trimmed } : { delta };
}

/** 한 운영일(`YYYY-MM-DD`)의 당일 봉사자 기록을 호실순으로 받는다(`GET /api/v1/volunteer/duties?date=`, 관리자 전용). */
export async function fetchDutyRecords(date: string): Promise<DutyRecord[]> {
  const res = await request(`/duties?date=${encodeURIComponent(date)}`);
  const body = (await res.json()) as VolunteerDutyRecordApiResponse[];
  if (!Array.isArray(body)) throw new Error("dutyRecords: unexpected response");
  return body.map(toDutyRecord);
}

/**
 * 그 달에서 미이행이 있는 운영일과 인원을 받는다(`GET /api/v1/volunteer/duties/summary?month=YYYY-MM`).
 * 횟수를 처리한 미이행과 처리하지 않은 미이행을 함께 센다.
 */
export async function fetchMissedSummary(
  year: number,
  month: number,
): Promise<Record<string, number>> {
  const key = `${year}-${String(month).padStart(2, "0")}`;
  const res = await request(`/duties/summary?month=${key}`);
  const body = (await res.json()) as Record<string, unknown>;
  const summary: Record<string, number> = {};
  for (const [date, count] of Object.entries(body ?? {})) {
    if (typeof count !== "number" || !Number.isFinite(count)) {
      throw new Error("missedSummary: unexpected response");
    }
    summary[date] = count;
  }
  return summary;
}

/**
 * 한 학생의 봉사 횟수 조정 이력을 최신순으로 받는다(`GET /api/v1/volunteer/{id}/adjustments`, 관리자 전용, 기본 50건).
 * 당일 봉사 완료로 줄어든 -1도 들어 있다.
 */
export async function fetchVolunteerAdjustments(
  id: number,
): Promise<VolunteerAdjustment[]> {
  const res = await request(`/${id}/adjustments`);
  const body = (await res.json()) as VolunteerAdjustmentApiResponse[];
  if (!Array.isArray(body)) throw new Error("adjustments: unexpected response");
  return body.map((item, index) => {
    if (!Number.isInteger(item.delta)) {
      throw new Error("adjustments: unexpected item");
    }
    return {
      id: `${item.createdAt ?? "unknown"}#${index}`,
      date: toMonthDay(item.createdAt) ?? "-",
      title: adjustmentTitle(item),
      delta: item.delta,
    };
  });
}
