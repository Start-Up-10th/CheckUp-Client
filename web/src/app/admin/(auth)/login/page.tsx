import { AdminLoginButton } from "@/components/admin/AdminLoginButton";
import { AdminLoginRedirect } from "@/components/admin/AdminLoginRedirect";
import { LoginCard } from "@/components/LoginCard";

/**
 * REQ-AUTH-001: 관리자 DataGSM OAuth 로그인.
 *
 * 버튼은 서버의 GET /api/v1/auth/login으로 이동한다.
 * 서버가 state·PKCE를 생성·저장하고 DataGSM 인가 URL로 302 리다이렉트한다.
 * 프론트에서 인가 URL을 직접 조립하면 state 검증(INVALID_OAUTH_STATE)이 실패한다.
 *
 * Figma 관리자-컴퓨터 01 · 로그인(16:547)의 카드를 화면 한가운데(위 406 = (1080−268)/2)에 둔다.
 * 패드·핸드폰도 같은 카드이고 화면이 좁으면 양옆 16px을 남기고 폭만 줄인다(`LoginCard`, DEC-054).
 */
export default function AdminLoginPage() {
  return (
    <main className="flex h-full w-full items-center justify-center px-4">
      <AdminLoginRedirect />
      <LoginCard>
        <AdminLoginButton />
      </LoginCard>
    </main>
  );
}
