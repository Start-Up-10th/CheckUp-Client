const GENERIC_FAILURE = "로그인에 실패했습니다. 다시 시도해 주세요.";

/**
 * 서버가 계정을 거부하는 오류 코드와 서버 문구(CheckUp-server `ErrorCode`). 서버 로그인 콜백은 실패하면
 * `/login?error=<코드>`로 돌려보낸다. 문구는 서버와 같게 둬서 서버 기준이 바뀌면 함께 고친다.
 */
const REJECTED_ACCOUNT_MESSAGES: Record<string, string> = {
  INACTIVE_ACCOUNT: "올바르지 않은 계정 상태입니다.",
  MISSING_STUDENT_INFO: "학생 정보가 없습니다.",
  UNSUPPORTED_ACCOUNT: "이용 권한이 없는 계정입니다.",
};

/**
 * 로그인 화면 쿼리의 `error` 값으로 보여 줄 실패 문구를 정한다(REQ-AUTH-001).
 * 쿼리가 없으면 실패가 아니므로 null이다. 계정이 거부된 세 코드는 서버 문구를, 그 밖의 값
 * (DataGSM 오류·state 오류·취소와 로그인 완료 화면이 붙이는 `error=1`)은 일반 실패 문구를 돌려준다.
 */
export function loginFailureMessage(error: string | undefined): string | null {
  if (error === undefined) return null;
  return Object.hasOwn(REJECTED_ACCOUNT_MESSAGES, error)
    ? REJECTED_ACCOUNT_MESSAGES[error]
    : GENERIC_FAILURE;
}
