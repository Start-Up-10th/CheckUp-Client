import {
  DATAGSM_BUTTON_CLASS,
  DataGsmButtonContent,
} from "@/components/LoginCard";
import { LOGIN_START_PATH } from "@/lib/auth/auth-api";

/**
 * 관리자 로그인 카드의 `DataGSM으로 계속하기` 버튼(REQ-AUTH-001). 사용자 로그인과 같은 서버 로그인 시작 주소로 이동하고,
 * 로그인한 뒤에는 관리자 권한 계정이 어느 로그인으로 들어왔든 관리자 홈으로 간다(DEC-055).
 */
export function AdminLoginButton() {
  return (
    <a href={LOGIN_START_PATH} className={DATAGSM_BUTTON_CLASS}>
      <DataGsmButtonContent />
    </a>
  );
}
