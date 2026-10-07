"use client";

import { ToastLayer } from "@/components/admin/Toast";
import { LOGIN_START_PATH } from "@/lib/auth/auth-api";
import { LoginCard } from "@/components/LoginCard";
import { DataGsmLoginButton } from "./DataGsmLoginButton";

/**
 * 학생 로그인(REQ-AUTH-001). 관리자 로그인과 같은 카드(`LoginCard`, DEC-054): 가운데 흰 카드에 CHECKUP 로고,
 * `기숙사 입소를 편리하게`, 검은 `DataGSM으로 계속하기` 버튼. 배경은 핸드폰 #f5f5f7, 노트북 #f2f2f3(Figma 값)이다.
 *
 * 실패 문구는 핸드폰 Figma state messages(3:42) 문구로 통일한다 — 노트북 Figma의
 * "계정 또는 비밀번호가 올바르지 않습니다."는 비밀번호 입력이 없는 REQ-AUTH-001과 맞지 않는다
 * (사용자 결정 2026-09-26). 서버가 계정을 거부한 경우(`login-error.ts`)만 서버 문구를 쓴다
 * (사용자 결정 2026-10-01). 위치는 Figma에 없어 핸드폰 아래 32px, 노트북 오른쪽 위 32px·폭 380px
 * (학생 홈 서버 오류와 같은 자리)로 둔다.
 */
export function StudentLogin({
  failureMessage = null,
}: {
  failureMessage?: string | null;
}) {
  // 서버 로그인 시작 주소로 페이지째 이동한다(같은 출처 `/api` 프록시). 서버가 state·PKCE를 만들어
  // DataGSM 로그인으로 보내고, 콜백 검증·토큰 교환·세션 발급도 서버가 한다(REQ-AUTH-001).
  // 웹은 DataGSM 주소·클라이언트 ID를 직접 만들지 않는다. 앱 안 이동(router)이 아니라 서버 302를
  // 따라가야 하므로 location을 바꾼다.
  const login = () => {
    window.location.assign(LOGIN_START_PATH);
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f5f5f7] px-4 md:bg-admin-bg">
      <LoginCard>
        <DataGsmLoginButton onClick={login} />
      </LoginCard>
      <ToastLayer
        toast={
          failureMessage !== null
            ? { variant: "error", message: failureMessage }
            : null
        }
      />
    </main>
  );
}
