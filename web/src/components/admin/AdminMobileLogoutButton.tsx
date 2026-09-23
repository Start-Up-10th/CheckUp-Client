"use client";

import { LogoutIcon } from "@/components/icons/AdminNavIcons";

/**
 * 반응형 기준: 관리자-핸드폰 하단 탭바는 4개 항목(홈/QR/얼굴/봉사)으로 고정이라 로그아웃을 넣지 않는다.
 * DEC-012: 휴대폰 관리자 로그아웃 위치는 웹 담당자 결정 — 화면 우상단 고정 아이콘으로 둔다.
 */
export function AdminMobileLogoutButton() {
  return (
    <button
      type="button"
      aria-label="로그아웃"
      className="fixed right-4 top-4 z-40 flex size-9 items-center justify-center rounded-full bg-admin-danger-bg text-admin-danger-text shadow-sm md:hidden"
    >
      <LogoutIcon className="size-[18px]" />
    </button>
  );
}
