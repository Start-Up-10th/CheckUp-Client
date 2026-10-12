"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutIcon } from "@/components/icons/AdminNavIcons";
import { ADMIN_NAV_ITEMS, isAdminNavActive } from "@/lib/admin/nav-items";
import { useAdminLogout } from "@/lib/admin/use-admin-logout";

/**
 * 반응형 기준: 1280px 이상(관리자-컴퓨터) — 라벨 있는 좌측 고정 사이드바 300px.
 * `activePath`는 로그인 없이 보는 확인용 페이지에서 활성 항목을 지정할 때만 쓴다(기본은 현재 주소).
 */
export function AdminSidebar({ activePath }: { activePath?: string }) {
  const currentPath = usePathname();
  const pathname = activePath ?? currentPath;
  const logout = useAdminLogout();

  return (
    <aside className="hidden h-full w-[300px] shrink-0 flex-col bg-admin-surface px-4 py-6 shadow-[inset_-1px_0_0_#e3e3e5] xl:flex">
      <div className="flex flex-col gap-0.5 overflow-hidden px-2 pb-6">
        <p className="font-mono text-[10px] leading-[13px] tracking-[2px] text-admin-textFaint">
          ADMIN
        </p>
        <p className="text-[17px] font-bold leading-5 tracking-[-0.34px] text-admin-text">
          기숙사 출석 관리
        </p>
      </div>

      <nav className="flex flex-col gap-1">
        {ADMIN_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isAdminNavActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex h-[42px] items-center gap-2.5 rounded-control px-3.5 text-sm ${
                active
                  ? "bg-admin-attendance-bg font-bold text-admin-attendance-text"
                  : "font-normal text-admin-textSecondary hover:bg-admin-bg"
              }`}
            >
              <Icon className="size-[18px] shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <button
        type="button"
        onClick={logout}
        className="flex h-[42px] items-center gap-2.5 rounded-control bg-admin-danger-bg px-3 text-sm font-normal text-admin-danger-text transition-colors hover:bg-admin-danger-border"
      >
        <LogoutIcon className="size-[18px]" />
        <span className="leading-[17px]">로그아웃</span>
      </button>
    </aside>
  );
}
