"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutIcon } from "@/components/icons/AdminNavIcons";
import { ADMIN_NAV_ITEMS, isAdminNavActive } from "@/lib/admin/nav-items";

/** 반응형 기준: 1280px 이상(관리자-컴퓨터) — 라벨 있는 좌측 고정 사이드바 300px. */
export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-full w-[300px] shrink-0 flex-col border-r border-admin-border bg-admin-surface px-4 py-6 xl:flex">
      <div className="flex flex-col gap-0.5 overflow-hidden px-2 pb-6">
        <p className="font-mono text-[10px] tracking-[2px] text-admin-textFaint">
          ADMIN
        </p>
        <p className="text-[17px] font-bold tracking-[-0.34px] text-admin-text">
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
        className="flex items-center justify-center gap-2.5 rounded-control bg-admin-danger-bg px-3.5 py-3 text-sm font-medium text-admin-danger-text"
      >
        <LogoutIcon className="size-[18px]" />
        <span>로그아웃</span>
      </button>
    </aside>
  );
}
