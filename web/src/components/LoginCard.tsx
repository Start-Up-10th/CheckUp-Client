import Image from "next/image";
import type { ReactNode } from "react";

/**
 * 관리자·사용자 로그인 화면이 함께 쓰는 카드(Figma 관리자-컴퓨터 01 · 로그인 16:547, DEC-054).
 * 흰색 350×268, 반지름 14px. 안쪽은 로고 197×52 · 15px · `기숙사 입소를 편리하게`(Pretendard SemiBold 16px #656b80) · 15px ·
 * 버튼(`children`)이고 위 74px 아래 49px 여백이다. 화면이 카드보다 좁으면 폭만 줄고(안쪽 230px은 그대로) 모든 화면에서 같은 크기다.
 * 가운데에 놓는 일은 부르는 쪽이 한다.
 */
export function LoginCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[268px] w-[350px] max-w-full flex-col items-center gap-[15px] rounded-[14px] bg-white pb-[49px] pt-[74px]">
      <h1 className="shrink-0">
        <Image
          src="/icons/login/checkup-logo.png"
          alt="CHECKUP"
          width={197}
          height={52}
          className="h-[52px] w-[197px] object-cover"
          priority
        />
      </h1>
      <p className="shrink-0 text-center text-base font-semibold leading-[normal] text-[#656b80]">
        기숙사 입소를 편리하게
      </p>
      {children}
    </div>
  );
}

/** `DataGSM으로 계속하기` 버튼의 모양: 230×44, 검은 배경, 반지름 6px(Figma DG로그인버튼 252:495). */
export const DATAGSM_BUTTON_CLASS =
  "relative block h-11 w-[230px] shrink-0 rounded-[6px] border border-[#e2e8f0] bg-black transition-colors hover:bg-[#1c1c1e]";

/**
 * 버튼 안쪽: 흰색 D 아이콘(10.7×12.8)은 왼쪽 6.67%, 글자(Pretendard Medium 14px 흰색)는 왼쪽 33%~오른쪽 21.33% 칸의 가운데다.
 */
export function DataGsmButtonContent() {
  return (
    <>
      <Image
        src="/icons/login/datagsm.svg"
        alt=""
        aria-hidden="true"
        width={11}
        height={13}
        className="absolute left-[6.67%] top-1/2 -translate-y-1/2"
      />
      <span className="absolute inset-y-0 left-[33%] right-[21.33%] flex items-center justify-center whitespace-nowrap text-center text-[14px] font-medium leading-none text-white">
        DataGSM으로 계속하기
      </span>
    </>
  );
}
