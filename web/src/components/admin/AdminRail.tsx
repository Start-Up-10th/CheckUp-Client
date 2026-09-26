"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutIcon } from "@/components/icons/AdminNavIcons";
import { ADMIN_NAV_ITEMS, isAdminNavActive } from "@/lib/admin/nav-items";
import { useAdminLogout } from "@/lib/admin/use-admin-logout";

/** 반응형 기준: 768~1279px(관리자-패드) — 좌측 축소형 아이콘 레일, 라벨 없이 아이콘만. */
export function AdminRail() {
  const pathname = usePathname();
  const logout = useAdminLogout();

  return (
    <aside className="hidden h-full w-[96px] shrink-0 flex-col items-center border-r border-admin-border bg-admin-surface py-6 md:flex xl:hidden">
      <nav className="flex w-full flex-col items-center gap-1 px-2">
        {ADMIN_NAV_ITEMS.map(({ href, label, shortLabel, icon: Icon }) => {
          const active = isAdminNavActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`flex w-full flex-col items-center gap-[5px] rounded-control py-2.5 ${
                active
                  ? "bg-admin-attendance-bg text-admin-attendance-text"
                  : "text-admin-textSecondary hover:bg-admin-bg"
              }`}
            >
              <Icon className="size-[18px] shrink-0" />
              <span className="text-[10px] font-medium leading-3">
                {shortLabel}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <button
        type="button"
        aria-label="로그아웃"
        onClick={logout}
        className="mx-2 flex w-[calc(100%-16px)] flex-col items-center gap-[5px] rounded-control bg-admin-danger-bg py-2.5 text-admin-danger-text"
      >
        <LogoutIcon className="size-[18px]" />
        <span className="text-[10px] font-medium leading-3">로그아웃</span>
      </button>
    </aside>
  );
}
