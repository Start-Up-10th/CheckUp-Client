import { throwIfRateLimited } from "@/lib/rate-limit";
import {
  toQrAttendanceResult,
  type QrAttendanceResult,
} from "./qr-attendance-result";

/** 로그인이 필요하다(401). 로그인 후 같은 QR로 돌아와 다시 제출한다. */
export class QrLoginRequiredError extends Error {
  constructor() {
    super("login required");
  }
}

/** 학생 정보가 없는 계정이다(403 `MISSING_STUDENT_INFO`). 교사 계정 등 */
export class QrNotStudentError extends Error {
  constructor() {
    super("not a student");
  }
}

/** 학생이지만 필수 동의를 하지 않았다(403 `FACE_CONSENT_REQUIRED`). 동의 화면으로 보낸다. */
export class QrConsentRequiredError extends Error {
  constructor() {
    super("consent required");
  }
}

/** 학생이지만 기숙사 호실이 배정되지 않았다(403 `ROOM_NOT_ASSIGNED`). */
export class QrRoomNotAssignedError extends Error {
  constructor() {
    super("room not assigned");
  }
}

/** 오류 응답 본문의 `code`(서버 ErrorCode 이름). 본문이 없거나 읽을 수 없으면 null이다. */
async function errorCodeOf(res: Response): Promise<string | null> {
  try {
    const body = (await res.json()) as { code?: unknown };
    return typeof body.code === "string" ? body.code : null;
  } catch {
    return null;
  }
}

/**
 * REQ-ATT-005: `POST /api/v1/qr/attendance`에 토큰만 보내고 판정 결과를 받는다(하네스 DEC-018,
 * docs/plans/qr-attendance.md "스캔 API"). 학생 ID·성공 여부는 보내지 않는다 — 서버가 로그인한
 * 현재 학생으로 처리한다. 판정 결과는 모두 200 `{ "result" }`이고, 요청 자체가 거부되면
 * 401·403 오류를 던진다. 403은 본문의 `code`로 이유를 나눈다(#262): 동의 안 함·호실 미배정은 전용 오류,
 * 그 밖(`MISSING_STUDENT_INFO`, 코드를 읽을 수 없는 경우)은 학생 아님 오류다. 네트워크 오류·5xx는 판정이 아니므로 그대로 오류로 올린다.
 * 토큰은 오류 메시지에 넣지 않는다.
 */
export async function submitQrAttendance(
  token: string,
): Promise<QrAttendanceResult> {
  const res = await fetch("/api/v1/qr/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ token }),
  });
  if (res.status === 401) throw new QrLoginRequiredError();
  if (res.status === 403) {
    const code = await errorCodeOf(res);
    if (code === "FACE_CONSENT_REQUIRED") throw new QrConsentRequiredError();
    if (code === "ROOM_NOT_ASSIGNED") throw new QrRoomNotAssignedError();
    throw new QrNotStudentError();
  }
  if (res.status === 400) return "invalid";
  throwIfRateLimited(res);
  if (!res.ok) throw new Error(`qrAttendance: ${res.status}`);
  const body = (await res.json()) as { result?: unknown };
  return toQrAttendanceResult(
    typeof body.result === "string" ? body.result : "",
  );
}
