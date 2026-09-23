"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS, isAdminNavActive } from "@/lib/admin/nav-items";

/** 반응형 기준: ~767px(관리자-핸드폰) — 하단 탭바 4개(축약 라벨). 로그아웃은 별도 위치(AdminMobileLogoutButton). */
export function AdminBottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-admin-border bg-admin-surface md:hidden">
      {ADMIN_NAV_ITEMS.map(({ href, shortLabel, icon: Icon }) => {
        const active = isAdminNavActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 flex-col items-center justify-center gap-1 text-xs ${
              active
                ? "font-bold text-admin-attendance-text"
                : "text-admin-textSecondary"
            }`}
          >
            <Icon className="size-[18px]" />
            <span>{shortLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
