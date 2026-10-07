import Image from "next/image";
import { AdminLoginButton } from "@/components/admin/AdminLoginButton";
import { AdminLoginRedirect } from "@/components/admin/AdminLoginRedirect";

/**
 * REQ-AUTH-001: 관리자 DataGSM OAuth 로그인.
 *
 * 버튼은 서버의 GET /api/v1/auth/login으로 이동한다.
 * 서버가 state·PKCE를 생성·저장하고 DataGSM 인가 URL로 302 리다이렉트한다.
 * 프론트에서 인가 URL을 직접 조립하면 state 검증(INVALID_OAUTH_STATE)이 실패한다.
 *
 * 수치 근거 (Figma node 278:6 핸드폰 / 51:6 패드):
 *   로고: 폰 w=171 h=45 top=(56+394)/844=53.3%  | 패드 w=201 h=53 top=520/1024=50.78%
 *   버튼: 폰 w=300 h=48 top=(56+601)/844=77.84% | 패드 w=300 h=48 top=735/1024=71.78%
 *   버튼: bg=#f8fafc border=#e2e8f0 1px radius=6px
 *   D 아이콘: size=14×14 left=20px(6.67%) 세로 중앙 | 텍스트: Pretendard Medium 14px #0f172a, 아이콘 오른쪽 남은 폭의 가운데
 *   컴퓨터(Figma 16:547): 로고 262×69 top=537/1080=49.72% | 버튼 top=768/1080=71.11%
 */
export default function AdminLoginPage() {
  return (
    <>
      <AdminLoginRedirect />

      {/* CHECKUP 로고 */}
      <div className="absolute left-1/2 top-[53.2%] -translate-x-1/2 md:top-[50.78%] xl:top-[49.72%]">
        <Image
          src="/icons/admin-login/checkup-logo.png"
          alt="CHECKUP"
          width={201}
          height={53}
          className="h-[45px] w-auto md:h-[53px] xl:h-[69px]"
          priority
        />
      </div>

      {/* DataGSM 로그인 버튼 */}
      <div className="absolute left-1/2 top-[77.84%] -translate-x-1/2 md:top-[71.78%] xl:top-[71.11%]">
        <AdminLoginButton />
      </div>
    </>
  );
}
