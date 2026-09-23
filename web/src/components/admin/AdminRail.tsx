"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutIcon } from "@/components/icons/AdminNavIcons";
import { ADMIN_NAV_ITEMS, isAdminNavActive } from "@/lib/admin/nav-items";

/** 반응형 기준: 768~1279px(관리자-패드) — 좌측 축소형 아이콘 레일, 라벨 없이 아이콘만. */
export function AdminRail() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-full w-[88px] shrink-0 flex-col items-center border-r border-admin-border bg-admin-surface py-6 md:flex xl:hidden">
      <nav className="flex flex-col items-center gap-1">
        {ADMIN_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isAdminNavActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`flex size-[52px] items-center justify-center rounded-control ${
                active
                  ? "bg-admin-attendance-bg text-admin-attendance-text"
                  : "text-admin-textSecondary hover:bg-admin-bg"
              }`}
            >
              <Icon className="size-[18px] shrink-0" />
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <button
        type="button"
        aria-label="로그아웃"
        className="flex size-[52px] items-center justify-center rounded-control bg-admin-danger-bg text-admin-danger-text"
      >
        <LogoutIcon className="size-[18px]" />
      </button>
    </aside>
  );
}
