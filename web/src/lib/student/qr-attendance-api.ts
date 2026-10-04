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

/**
 * REQ-ATT-005: `POST /api/v1/qr/attendance`에 토큰만 보내고 판정 결과를 받는다(하네스 DEC-018,
 * docs/plans/qr-attendance.md "스캔 API"). 학생 ID·성공 여부는 보내지 않는다 — 서버가 로그인한
 * 현재 학생으로 처리한다. 판정 결과는 모두 200 `{ "result" }`이고, 요청 자체가 거부되면
 * 401·403 오류를 던진다. 네트워크 오류·5xx는 판정이 아니므로 그대로 오류로 올린다.
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
  if (res.status === 403) throw new QrNotStudentError();
  if (res.status === 400) return "invalid";
  if (!res.ok) throw new Error(`qrAttendance: ${res.status}`);
  const body = (await res.json()) as { result?: unknown };
  return toQrAttendanceResult(
    typeof body.result === "string" ? body.result : "",
  );
}
