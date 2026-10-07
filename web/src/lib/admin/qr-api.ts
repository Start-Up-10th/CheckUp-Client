import type { Purpose } from "@/lib/admin/purpose";
import { throwIfRateLimited } from "@/lib/admin/rate-limit";

export type ApiPurpose = "DORMITORY" | "STUDY_ROOM";

export const PURPOSE_TO_API: Record<Purpose, ApiPurpose> = {
  dorm: "DORMITORY",
  study: "STUDY_ROOM",
};

/** 서버 응답 원본. 시각은 ISO-8601 UTC 문자열이다(하네스 qr-attendance.md "관리자 API 응답"). */
type QrSessionApiResponse = {
  sessionId: string;
  qrUrl: string;
  tokenExpiresAt: string;
  serverTime: string;
};

/** 화면에서 쓰는 형태. 시각은 계산하기 쉽게 unix ms로 바꾼다. */
export type QrCreateResponse = {
  sessionId: string;
  qrUrl: string;
  tokenExpiresAt: number; // unix ms
  serverTime: number; // unix ms
};

export type QrHeartbeatResponse = {
  qrUrl: string;
  tokenExpiresAt: number;
  serverTime: number;
};

function toEpochMs(iso: string, field: string): number {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) throw new Error(`invalid ${field}`);
  return ms;
}

function toQrSession(body: QrSessionApiResponse): QrCreateResponse {
  return {
    sessionId: body.sessionId,
    qrUrl: body.qrUrl,
    tokenExpiresAt: toEpochMs(body.tokenExpiresAt, "tokenExpiresAt"),
    serverTime: toEpochMs(body.serverTime, "serverTime"),
  };
}

export class QrSessionNotFoundError extends Error {
  constructor() {
    super("QR session not found");
  }
}

/** 세션이 없거나 만료돼 서버가 401을 준 경우. 화면은 관리자 로그인으로 보낸다. */
export class AdminUnauthorizedError extends Error {
  constructor() {
    super("admin session expired");
  }
}

/** REQ-ATT-003: 페이지 진입 시 새 QR 세션 발급. 401이면 AdminUnauthorizedError */
export async function createQrSession(
  purpose: Purpose,
): Promise<QrCreateResponse> {
  const res = await fetch("/api/v1/qr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ purpose: PURPOSE_TO_API[purpose] }),
  });
  if (res.status === 401) throw new AdminUnauthorizedError();
  throwIfRateLimited(res);
  if (!res.ok) throw new Error(`createQrSession: ${res.status}`);
  return toQrSession((await res.json()) as QrSessionApiResponse);
}

/** REQ-ATT-004: heartbeat로 qrUrl 교체·세션 유지. 401이면 AdminUnauthorizedError, 404면 QrSessionNotFoundError */
export async function heartbeatQrSession(
  sessionId: string,
): Promise<QrHeartbeatResponse> {
  const res = await fetch(
    `/api/v1/qr/${encodeURIComponent(sessionId)}/heartbeat`,
    { method: "POST", credentials: "include" },
  );
  if (res.status === 401) throw new AdminUnauthorizedError();
  if (res.status === 404) throw new QrSessionNotFoundError();
  throwIfRateLimited(res);
  if (!res.ok) throw new Error(`heartbeat: ${res.status}`);
  const { qrUrl, tokenExpiresAt, serverTime } = toQrSession(
    (await res.json()) as QrSessionApiResponse,
  );
  return { qrUrl, tokenExpiresAt, serverTime };
}

/** REQ-ATT-003: 페이지 이탈 시 해당 세션만 종료 (sendBeacon) */
export function closeQrSession(sessionId: string): void {
  navigator.sendBeacon(`/api/v1/qr/${encodeURIComponent(sessionId)}/close`);
}
