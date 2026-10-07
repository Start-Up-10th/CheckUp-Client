"use client";

import Image from "next/image";
import { LOGIN_START_PATH } from "@/lib/auth/auth-api";
import { rememberLoginApp } from "@/lib/auth/login-app";

/**
 * 관리자 로그인 화면의 `DataGSM으로 계속하기` 버튼(REQ-AUTH-001). 서버 로그인 시작 주소로 이동하기 직전에 관리자 앱에서
 * 시작했다고 적어, 로그인 뒤 기숙사 자치위원(관리자이면서 학생)이 관리자 홈으로 가게 한다(DEC-047).
 */
export function AdminLoginButton() {
  return (
    <a
      href={LOGIN_START_PATH}
      onClick={() => rememberLoginApp("admin")}
      className="relative flex h-12 w-[300px] items-center rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc]"
    >
      <Image
        src="/icons/admin-login/datagsm-icon.svg"
        alt="DataGSM"
        width={14}
        height={14}
        className="absolute left-5 top-1/2 -translate-y-1/2"
      />
      <span className="flex-1 pl-[34px] text-center text-[14px] font-medium leading-none text-[#0f172a]">
        DataGSM으로 계속하기
      </span>
    </a>
  );
}
