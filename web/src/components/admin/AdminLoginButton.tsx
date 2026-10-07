"use client";

import Image from "next/image";
import { LOGIN_START_PATH } from "@/lib/auth/auth-api";
import { rememberLoginApp } from "@/lib/auth/login-app";

/**
 * 관리자 로그인 카드의 `DataGSM으로 계속하기` 버튼(REQ-AUTH-001). 서버 로그인 시작 주소로 이동하기 직전에 관리자 앱에서
 * 시작했다고 적어, 로그인 뒤 기숙사 자치위원(관리자이면서 학생)이 관리자 홈으로 가게 한다(DEC-047).
 *
 * Figma 16:547: 230×44, 검은 배경, 흰 글씨 Pretendard Medium 14px, 반지름 6px. D 아이콘(흰색 10.7×12.8)은 왼쪽 6.67%,
 * 글자는 왼쪽 33%~오른쪽 21.33% 칸의 가운데다. 모든 화면 크기에서 같은 크기다.
 */
export function AdminLoginButton() {
  return (
    <a
      href={LOGIN_START_PATH}
      onClick={() => rememberLoginApp("admin")}
      className="relative block h-11 w-[230px] shrink-0 rounded-[6px] border border-[#e2e8f0] bg-black transition-colors hover:bg-[#1c1c1e]"
    >
      <Image
        src="/icons/admin-login/datagsm-icon.svg"
        alt="DataGSM"
        width={11}
        height={13}
        className="absolute left-[6.67%] top-1/2 -translate-y-1/2"
      />
      <span className="absolute inset-y-0 left-[33%] right-[21.33%] flex items-center justify-center whitespace-nowrap text-center text-[14px] font-medium leading-none text-white">
        DataGSM으로 계속하기
      </span>
    </a>
  );
}
