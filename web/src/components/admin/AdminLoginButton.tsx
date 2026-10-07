"use client";

import {
  DATAGSM_BUTTON_CLASS,
  DataGsmButtonContent,
} from "@/components/LoginCard";
import { LOGIN_START_PATH } from "@/lib/auth/auth-api";
import { rememberLoginApp } from "@/lib/auth/login-app";

/**
 * 관리자 로그인 카드의 `DataGSM으로 계속하기` 버튼(REQ-AUTH-001). 서버 로그인 시작 주소로 이동하기 직전에 관리자 앱에서
 * 시작했다고 적는다. 로그인 완료 화면이 이 기록으로 관리자 로그인에서 온 관리자를 관리자 홈으로 보낸다(DEC-055).
 */
export function AdminLoginButton() {
  return (
    <a
      href={LOGIN_START_PATH}
      onClick={() => rememberLoginApp("admin")}
      className={DATAGSM_BUTTON_CLASS}
    >
      <DataGsmButtonContent />
    </a>
  );
}
