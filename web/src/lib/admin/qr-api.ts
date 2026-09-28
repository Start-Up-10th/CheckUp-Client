import type { Purpose } from "@/lib/admin/purpose";

type ApiPurpose = "DORMITORY" | "STUDY_ROOM";

const PURPOSE_TO_API: Record<Purpose, ApiPurpose> = {
  dorm: "DORMITORY",
  study: "STUDY_ROOM",
};

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

export class QrSessionNotFoundError extends Error {
  constructor() {
    super("QR session not found");
  }
}

/** REQ-ATT-003: 페이지 진입·용도 탭 선택 시 새 QR 세션 발급 */
export async function createQrSession(
  purpose: Purpose,
): Promise<QrCreateResponse> {
  const res = await fetch("/api/v1/qr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ purpose: PURPOSE_TO_API[purpose] }),
  });
  if (!res.ok) throw new Error(`createQrSession: ${res.status}`);
  return res.json() as Promise<QrCreateResponse>;
}

/** REQ-ATT-004: heartbeat로 qrUrl 교체·세션 유지. 404면 QrSessionNotFoundError */
export async function heartbeatQrSession(
  sessionId: string,
): Promise<QrHeartbeatResponse> {
  const res = await fetch(
    `/api/v1/qr/${encodeURIComponent(sessionId)}/heartbeat`,
    { method: "POST", credentials: "include" },
  );
  if (res.status === 404) throw new QrSessionNotFoundError();
  if (!res.ok) throw new Error(`heartbeat: ${res.status}`);
  return res.json() as Promise<QrHeartbeatResponse>;
}

/** REQ-ATT-003: 페이지 이탈·용도 탭 변경 시 해당 세션만 종료 (sendBeacon) */
export function closeQrSession(sessionId: string): void {
  navigator.sendBeacon(`/api/v1/qr/${encodeURIComponent(sessionId)}/close`);
}
