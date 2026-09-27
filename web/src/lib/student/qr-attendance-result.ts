/**
 * `POST /api/v1/qr/attendance` 결과 종류(REQ-ATT-004/005). 판정은 모두 서버가 한다.
 * - approved: 승인 / duplicate: 이미 출석 / expired: 만료 토큰 / closed: 관리자 인증 화면이 닫힘
 * - invalid: 우리 서비스 QR이 아니거나 읽을 수 없는 값(Figma 노트북 state message 345:43)
 */
export type QrAttendanceResult =
  "approved" | "duplicate" | "expired" | "closed" | "invalid";
