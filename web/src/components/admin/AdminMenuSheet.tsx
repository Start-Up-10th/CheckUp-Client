"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ADMIN_NAV_ITEMS, isAdminNavActive } from "@/lib/admin/nav-items";

type MenuIconProps = {
  src: string;
  /** 원본 SVG 크기(px). 20px 칸 안에서 가운데 맞춘다(Figma 메뉴 시트 아이콘 칸). */
  size: number;
  /** 로그아웃 아이콘(18px)은 20px 칸의 왼쪽 위에 놓인다. */
  alignStart?: boolean;
};

/** 원본 SVG를 색만 바꿔 쓰기 위해 mask로 그린다. 색은 부모의 currentColor로 정한다. */
function MenuIcon({ src, size, alignStart = false }: MenuIconProps) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-5 shrink-0 overflow-hidden ${
        alignStart ? "items-start justify-start" : "items-center justify-center"
      }`}
    >
      <span
        className="block shrink-0 bg-current"
        style={{
          width: size,
          height: size,
          maskImage: `url(${src})`,
          WebkitMaskImage: `url(${src})`,
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
        }}
      />
    </span>
  );
}

type AdminMenuSheetProps = {
  pathname: string;
  onClose: () => void;
  onLogout: () => void;
};

/**
 * Figma 관리자-핸드폰 `공통 · 메뉴 시트`: 하단 바의 메뉴 탭을 누르면 하단 바 위로 올라오는 시트다. QR 코드 생성 /
 * 얼굴 인식 생성 / 봉사자 관리 / 학생 관리와 구분선 아래 로그아웃이 있다. 지금 화면의 메뉴는 연두색이다.
 */
export function AdminMenuSheet({
  pathname,
  onClose,
  onLogout,
}: AdminMenuSheetProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-x-0 bottom-[60px] top-0 z-30 flex flex-col justify-end bg-[#1c1c1e]/45 md:hidden"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="메뉴"
        className="flex w-full flex-col gap-1 rounded-t-[22px] bg-admin-surface px-4 pb-4 pt-2.5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-center pb-2">
          <div className="h-1 w-9 rounded-sm bg-admin-border" />
        </div>

        {ADMIN_NAV_ITEMS.map(({ href, label, sheetIcon }) => {
          if (!sheetIcon) return null;
          const active = isAdminNavActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              onClick={onClose}
              className={`flex items-center gap-3.5 rounded-xl px-3.5 py-[13px] text-[15px] leading-[18px] ${
                active
                  ? "bg-admin-attendance-bg font-bold text-admin-attendance-text"
                  : "font-medium text-admin-ghost-text"
              }`}
            >
              <span
                className={
                  active ? "text-admin-attendance-text" : "text-admin-textMuted"
                }
              >
                <MenuIcon src={sheetIcon.src} size={sheetIcon.size} />
              </span>
              {label}
            </Link>
          );
        })}

        <div className="h-px w-full bg-admin-divider" />

        <button
          type="button"
          onClick={() => {
            onClose();
            onLogout();
          }}
          className="flex items-center gap-3.5 rounded-xl px-3.5 py-[13px] text-left text-[15px] font-medium leading-[18px] text-admin-danger-text"
        >
          <MenuIcon src="/icons/menu/logout.svg" size={18} alignStart />
          로그아웃
        </button>
      </div>
    </div>
  );
}
