import {
  toQrAttendanceResult,
  type QrAttendanceResult,
} from "./qr-attendance-result";

/**
 * TODO(REQ-ATT-005): 서버 스캔 API가 생기면 `POST /api/v1/qr/attendance`에 `{ "token": token }`을
 * 보내고, 200 응답의 `result`를 toQrAttendanceResult로 바꿔 돌려준다(하네스 DEC-018,
 * docs/plans/qr-attendance.md "스캔 API"). 학생 ID·성공 여부는 보내지 않는다 — 서버가 로그인한
 * 현재 학생으로 처리한다. 401(미로그인)·403(학생 아님)과 공통 API 클라이언트는 서버 연동 작업에서 다룬다.
 * 지금은 화면 흐름 확인용으로 어떤 토큰이든 승인 응답을 흉내 낸다.
 */
export const IS_MOCK_QR_ATTENDANCE = true;

export async function submitQrAttendance(
  token: string,
): Promise<QrAttendanceResult> {
  void token;
  const response = { result: "APPROVED" };
  return toQrAttendanceResult(response.result);
}
