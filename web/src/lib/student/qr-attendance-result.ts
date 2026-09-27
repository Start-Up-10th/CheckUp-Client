/**
 * `POST /api/v1/qr/attendance` 결과 종류(REQ-ATT-004/005). 판정은 모두 서버가 한다.
 * - approved: 승인 / duplicate: 이미 출석 / expired: 만료 토큰 / closed: 관리자 인증 화면이 닫힘
 * - invalid: 우리 서비스 QR이 아니거나 읽을 수 없는 값(Figma 노트북 state message 345:43)
 */
export type QrAttendanceResult =
  "approved" | "duplicate" | "expired" | "closed" | "invalid";

/** 스캔 API 응답 `{ "result": ... }` 값(하네스 DEC-018, docs/plans/qr-attendance.md "스캔 API"). */
export type QrScanApiResult =
  "APPROVED" | "DUPLICATE" | "EXPIRED" | "CLOSED" | "INVALID";

const API_RESULTS: Record<QrScanApiResult, QrAttendanceResult> = {
  APPROVED: "approved",
  DUPLICATE: "duplicate",
  EXPIRED: "expired",
  CLOSED: "closed",
  INVALID: "invalid",
};

/**
 * 서버의 대문자 결과를 화면용 소문자 결과로 바꾼다. 계약에 없는 값이 오면 승인으로 오해하지 않도록
 * `invalid`로 본다(서버가 새 결과를 추가하면 여기와 계약을 함께 고친다).
 */
export function toQrAttendanceResult(apiResult: string): QrAttendanceResult {
  return Object.hasOwn(API_RESULTS, apiResult)
    ? API_RESULTS[apiResult as QrScanApiResult]
    : "invalid";
}
