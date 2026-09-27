import Image from "next/image";

/**
 * REQ-AUTH-001: 관리자 DataGSM OAuth 로그인.
 *
 * 수치 근거 (Figma node 278:6 핸드폰 / 51:6 패드):
 *   로고: 폰 w=171 h=45 top=(56+394)/844=53.3%  | 패드 w=201 h=53 top=520/1024=50.78%
 *   버튼: 폰 w=300 h=48 top=(56+601)/844=77.84% | 패드 w=300 h=48 top=735/1024=71.78%
 *   버튼: bg=#f8fafc border=#e2e8f0 1px radius=6px
 *   D 아이콘: size=14×14 left=20px(6.67%) 세로 중앙 | 텍스트: Pretendard Medium 14px #0f172a
 */
export default function AdminLoginPage() {
  return (
    <>
      {/* CHECKUP 로고 */}
      <div className="absolute left-1/2 top-[53.2%] -translate-x-1/2 md:top-[50.78%]">
        <Image
          src="/icons/admin-login/checkup-logo.png"
          alt="CHECKUP"
          width={201}
          height={53}
          className="h-[45px] w-auto md:h-[53px]"
          priority
        />
      </div>

      {/* DataGSM 로그인 버튼 */}
      <div className="absolute left-1/2 top-[77.84%] -translate-x-1/2 md:top-[71.78%]">
        <button
          type="button"
          className="relative flex h-12 w-[300px] items-center justify-center rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc]"
        >
          <Image
            src="/icons/admin-login/datagsm-icon.svg"
            alt="DataGSM"
            width={14}
            height={14}
            className="absolute left-5 top-1/2 -translate-y-1/2"
          />
          <span className="text-[14px] font-medium leading-none text-[#0f172a]">
            DataGSM으로 계속하기
          </span>
        </button>
      </div>
    </>
  );
}
