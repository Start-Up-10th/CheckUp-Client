"use client";

import Image from "next/image";
import { useAdminLogout } from "@/lib/admin/use-admin-logout";

// REQ-AUTH-001: 관리자 권한 없는 계정 로그인 시 예외 화면.
export default function AdminUnauthorizedPage() {
  const logout = useAdminLogout();

  return (
    <div className="absolute left-1/2 top-1/2 w-[300px] -translate-x-1/2 -translate-y-1/2 text-center">
      <Image
        src="/icons/admin-login/checkup-logo.png"
        alt="CHECKUP"
        width={201}
        height={53}
        className="mx-auto mb-8 h-[45px] w-auto md:h-[53px]"
        priority
      />
      <p className="mb-1 text-[17px] font-bold text-[#1c1c1e]">
        접근 권한이 없습니다
      </p>
      <p className="mb-8 text-[14px] text-[#8e8e93]">
        관리자 계정으로 다시 로그인해 주세요.
      </p>
      <button
        type="button"
        onClick={logout}
        className="w-full rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] py-3 text-[14px] font-medium text-[#0f172a]"
      >
        로그인 페이지로 돌아가기
      </button>
    </div>
  );
}
