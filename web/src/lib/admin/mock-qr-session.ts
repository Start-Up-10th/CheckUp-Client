import type { Purpose } from "@/lib/admin/purpose";

export type QrPurpose = Purpose;

export type QrSession = {
  token: string;
  purpose: QrPurpose;
  issuedAt: number;
  expiresAt: number;
};

/** REQ-ATT-004: 15분마다 갱신한다. */
export const QR_SESSION_DURATION_MS = 15 * 60 * 1000;

/**
 * TODO(REQ-ATT-003/004): 실제로는 서버가 페이지 세션 단위로 추측 불가능한 서명 토큰을 발급하고
 * lease/heartbeat로 관리한다(DEC-007). 여기서는 화면 개발용으로 토큰 문자열만 흉내 낸다 — 이
 * 값으로 실제 출석 처리가 되지 않으며, 운영에서 그대로 쓰지 않는다.
 */
export function createMockQrSession(
  purpose: QrPurpose,
  now: number = Date.now(),
): QrSession {
  const token = `mock-${purpose}-${now}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    token,
    purpose,
    issuedAt: now,
    expiresAt: now + QR_SESSION_DURATION_MS,
  };
}

export function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
