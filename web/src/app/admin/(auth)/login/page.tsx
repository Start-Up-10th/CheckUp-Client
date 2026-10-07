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
 * Figma 관리자-컴퓨터 01 · 로그인(16:547)의 카드: 흰색 350×268, 반지름 14px, 화면 한가운데(위 406 = (1080−268)/2).
 * 안쪽은 로고 197×52 · 15px · `기숙사 입소를 편리하게`(Pretendard SemiBold 16px #656b80) · 15px · 버튼 230×44이고
 * 위 74px 아래 49px 여백이다. 패드·핸드폰 Figma는 아직 이전 디자인이라, 같은 카드를 그대로 가운데에 두고
 * 화면이 카드보다 좁으면(양옆 16px 남김) 카드 폭만 줄인다(안쪽 230px은 그대로).
 */
export default function AdminLoginPage() {
  return (
    <>
      <AdminLoginRedirect />

      <main className="absolute left-1/2 top-1/2 flex h-[268px] w-[350px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-[15px] rounded-[14px] bg-white pb-[49px] pt-[74px]">
        <Image
          src="/icons/admin-login/checkup-logo.png"
          alt="CHECKUP"
          width={197}
          height={52}
          className="h-[52px] w-[197px] shrink-0 object-cover"
          priority
        />
        <p className="shrink-0 text-center text-base font-semibold leading-[normal] text-[#656b80]">
          기숙사 입소를 편리하게
        </p>
        <AdminLoginButton />
      </main>
    </>
  );
}
