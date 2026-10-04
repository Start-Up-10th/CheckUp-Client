/** 로그인이 필요하다(401). */
export class VolunteerLoginRequiredError extends Error {
  constructor() {
    super("login required");
  }
}

export type VolunteerRecord = {
  /** 목록 key. 운영일(YYYY-MM-DD)이다 — 학생·운영일마다 봉사는 하나다. */
  id: string;
  /** 날짜(요일) 문구(예: "10월 3일 (금)") */
  dateLabel: string;
  /** 이 기록의 봉사 횟수. 완료 한 건이 1회다. */
  count: number;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 운영일(`YYYY-MM-DD`, 서버가 08:00 KST 기준으로 정한 날짜)을 `10월 3일 (금)`으로 바꾼다.
 * 이미 한국 날짜라 시간대 변환 없이 달력 날짜 그대로 쓴다. 읽을 수 없으면 원문 그대로다.
 */
export function toVolunteerDateLabel(operatingDay: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(operatingDay);
  if (!match) return operatingDay;
  const [, y, m, d] = match.map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${m}월 ${d}일 (${weekday})`;
}

async function getJson(url: string, name: string): Promise<unknown> {
  const res = await fetch(url, { credentials: "include" });
  if (res.status === 401) throw new VolunteerLoginRequiredError();
  if (!res.ok) throw new Error(`${name}: ${res.status}`);
  return res.json();
}

/**
 * REQ-COM-003: `GET /api/v1/users/{studentId}/volunteer`로 본인 남은 봉사 횟수(앞으로 해야 할 횟수,
 * DEC-020·021)를 받는다. `studentId`는 `/api/v1/auth/me`의 DataGSM 학생 id이고, 서버가 본인·관리자만 허락한다.
 */
export async function fetchRemainingVolunteerCount(
  studentId: number,
): Promise<number> {
  const body = (await getJson(
    `/api/v1/users/${studentId}/volunteer`,
    "volunteerCount",
  )) as { volunteerCount?: unknown };
  if (!Number.isInteger(body.volunteerCount)) {
    throw new Error("volunteerCount: unexpected response");
  }
  return body.volunteerCount as number;
}

/**
 * REQ-COM-003: `GET /api/v1/users/{studentId}/volunteer/history`로 본인 봉사 완료 내역을 받는다
 * (CheckUp-server#120). 자치위원이 완료를 확인한 봉사만 최신 운영일부터 오고, 한 건이 1회다.
 */
export async function fetchVolunteerHistory(
  studentId: number,
): Promise<VolunteerRecord[]> {
  const body = (await getJson(
    `/api/v1/users/${studentId}/volunteer/history`,
    "volunteerHistory",
  )) as { history?: unknown };
  if (!Array.isArray(body.history)) {
    throw new Error("volunteerHistory: unexpected response");
  }
  return body.history.map((item: unknown) => {
    const { operatingDay } = (item ?? {}) as { operatingDay?: unknown };
    if (typeof operatingDay !== "string") {
      throw new Error("volunteerHistory: unexpected response");
    }
    return {
      id: operatingDay,
      dateLabel: toVolunteerDateLabel(operatingDay),
      count: 1,
    };
  });
}
