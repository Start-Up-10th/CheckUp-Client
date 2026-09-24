"use client";

import { useRouter } from "next/navigation";
import { MaskIcon } from "./MaskIcon";

/**
 * 핸드폰 마이페이지 하단 로그아웃(Figma 309:11). 노트북은 사이드바 하단에 있어 여기서는 숨긴다.
 * 확인 없이 로그인 화면으로 간다(REQ-AUTH-005) — 세션 정리는 서버 연동 후.
 */
export function LogoutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/login")}
      className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-admin-danger-border bg-admin-danger-bg px-[18px] text-[15px] font-medium leading-normal text-admin-danger-text md:hidden"
    >
      <MaskIcon src="/icons/student-nav/logout.svg" className="size-[18px]" />
      로그아웃
    </button>
  );
}
