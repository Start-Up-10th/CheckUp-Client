"use client";

import { useState } from "react";
import { LogoutConfirmDialog } from "./LogoutConfirmDialog";
import { MaskIcon } from "./MaskIcon";

/**
 * 핸드폰 마이페이지 하단 로그아웃(Figma 309:11). 노트북은 사이드바 하단에 있어 여기서는 숨긴다.
 * 누르면 바로 로그아웃하지 않고 사이드바와 같은 확인 창을 먼저 띄운다(REQ-AUTH-005, DEC-105).
 */
export function LogoutButton() {
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-admin-danger-border bg-admin-danger-bg px-[18px] text-[15px] font-medium leading-normal text-admin-danger-text transition-colors hover:bg-admin-danger-border xl:hidden"
      >
        <MaskIcon src="/icons/student-nav/logout.svg" className="size-[18px]" />
        로그아웃
      </button>
      {confirming && (
        <LogoutConfirmDialog onCancel={() => setConfirming(false)} />
      )}
    </>
  );
}
