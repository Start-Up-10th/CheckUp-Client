import type { QrAttendanceResult } from "./qr-attendance-result";

/**
 * TODO(REQ-ATT-005): 서버 연동 후 읽은 QR 문자열(링크/토큰 형식은 QR 백엔드 담당이 contracts에
 * 정한다)을 `POST /api/v1/qr/attendance`로 보내 결과를 받는다. 학생 ID는 보내지 않는다 —
 * 서버가 로그인한 현재 학생으로 처리한다. 지금은 화면 흐름 확인용으로 어떤 QR이든 승인한다.
 */
export const IS_MOCK_QR_ATTENDANCE = true;

export async function submitQrAttendance(
  qrText: string,
): Promise<QrAttendanceResult> {
  void qrText;
  return "approved";
}
