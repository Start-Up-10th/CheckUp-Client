"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS, isAdminNavActive } from "@/lib/admin/nav-items";
import { useAdminLogout } from "@/lib/admin/use-admin-logout";

/**
 * 원본 SVG를 색만 바꿔 쓰기 위해 mask로 그린다 — 활성/비활성/로그아웃 색은 currentColor로 정한다.
 * Figma 관리자-핸드폰 탭 아이콘은 20px 프레임 안에 놓인다.
 */
function TabIcon({ src, className }: { src: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block size-5 bg-current ${className ?? ""}`}
      style={{
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        maskSize: "contain",
        WebkitMaskSize: "contain",
      }}
    />
  );
}

/**
 * REQ-UI-005 / DEC-026: ~767px(관리자-핸드폰) 하단 탭바는 라벨 없이 아이콘만 있는 5탭이다.
 * 홈 / QR / 얼굴 / 봉사 / 로그아웃(맨 오른쪽, 경고색). 로그아웃은 사이드바와 같이 인증(P2) 연결 전까지 동작이 없다.
 */
export function AdminBottomTabBar() {
  const pathname = usePathname();
  const logout = useAdminLogout();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-[60px] items-stretch bg-admin-surface shadow-[inset_0_1px_0_0_#e3e3e5] md:hidden">
      {ADMIN_NAV_ITEMS.map(({ href, label, tabIconSrc }) => {
        const active = isAdminNavActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 items-center justify-center ${
              active ? "text-admin-attendance-text" : "text-[#b9b9be]"
            }`}
          >
            <TabIcon src={tabIconSrc} />
          </Link>
        );
      })}
      <button
        type="button"
        aria-label="로그아웃"
        onClick={logout}
        className="flex flex-1 items-center justify-center text-admin-danger-text"
      >
        <TabIcon src="/icons/tab/logout.svg" className="size-[18px]" />
      </button>
    </nav>
  );
}
