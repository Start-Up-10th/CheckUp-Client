"use client";

import { useLogout } from "@/lib/student/use-logout";
import { MaskIcon } from "./MaskIcon";

/**
 * 핸드폰 마이페이지 하단 로그아웃(Figma 309:11). 노트북은 사이드바 하단에 있어 여기서는 숨긴다.
 * 로그아웃 동작은 사이드바와 같은 useLogout()을 쓴다(REQ-AUTH-005).
 */
export function LogoutButton() {
  const logout = useLogout();

  return (
    <button
      type="button"
      onClick={logout}
      className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-admin-danger-border bg-admin-danger-bg px-[18px] text-[15px] font-medium leading-normal text-admin-danger-text md:hidden"
    >
      <MaskIcon src="/icons/student-nav/logout.svg" className="size-[18px]" />
      로그아웃
    </button>
  );
}
