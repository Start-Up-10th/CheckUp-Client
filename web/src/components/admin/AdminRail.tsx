"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutIcon } from "@/components/icons/AdminNavIcons";
import { ADMIN_NAV_ITEMS, isAdminNavActive } from "@/lib/admin/nav-items";
import { useAdminLogout } from "@/lib/admin/use-admin-logout";

/**
 * 반응형 기준: 768~1279px(관리자-패드) — 좌측 96px 아이콘 레일(오른쪽 선 1px은 안쪽에 그려 항목 폭 76px을 유지한다). 메뉴는 위에, 로그아웃은 맨 아래다(Figma 08 패드 레일).
 * `activePath`는 로그인 없이 보는 확인용 페이지에서 활성 항목을 지정할 때만 쓴다(기본은 현재 주소).
 */
export function AdminRail({ activePath }: { activePath?: string }) {
  const currentPath = usePathname();
  const pathname = activePath ?? currentPath;
  const logout = useAdminLogout();

  return (
    <aside className="hidden h-full w-[96px] shrink-0 shadow-[inset_-1px_0_0_#e3e3e5] md:flex xl:hidden">
      <div className="flex w-full flex-col items-center gap-2.5 bg-admin-surface px-2.5 py-[22px]">
        <div aria-hidden="true" className="h-3.5 w-px shrink-0" />
        <nav className="flex w-full flex-col items-center gap-2.5">
          {ADMIN_NAV_ITEMS.map(({ href, label, shortLabel, icon: Icon }) => {
            const active = isAdminNavActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={`flex w-full flex-col items-center gap-1.5 rounded-[14px] border py-[11px] ${
                  active
                    ? "border-admin-attendance-border bg-admin-attendance-bg text-admin-attendance-text"
                    : "border-transparent text-admin-textFaint hover:bg-admin-bg"
                }`}
              >
                <Icon className="size-[22px] shrink-0" />
                <span className="text-[10px] leading-3">{shortLabel}</span>
              </Link>
            );
          })}
        </nav>

        <div className="min-h-0 w-full flex-1" />

        <button
          type="button"
          aria-label="로그아웃"
          onClick={logout}
          className="flex w-full flex-col items-center gap-1.5 rounded-[14px] bg-admin-danger-bg py-3 text-admin-danger-text"
        >
          <LogoutIcon className="size-[22px]" />
          <span className="text-[10px] font-medium leading-3">로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
