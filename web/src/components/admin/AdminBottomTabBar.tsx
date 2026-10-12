"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AdminMenuSheet } from "@/components/admin/AdminMenuSheet";
import { isAdminNavActive } from "@/lib/admin/nav-items";
import { useAdminLogout } from "@/lib/admin/use-admin-logout";

/**
 * 원본 SVG를 색만 바꿔 쓰기 위해 mask로 그린다 — 활성/비활성 색은 currentColor로 정한다.
 * Figma 관리자-핸드폰 탭 아이콘은 20px 프레임 안에 놓인다.
 */
function TabIcon({ src }: { src: string }) {
  return (
    <span
      aria-hidden="true"
      className="block size-5 bg-current"
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
 * REQ-UI-005: ~767px(관리자-핸드폰) 하단 바는 라벨 없이 아이콘만 있는 2칸이다. 홈과 메뉴(햄버거)이며, 메뉴를 열면
 * QR 코드 생성 / 얼굴 인식 생성 / 봉사자 관리 / 학생 관리 / 로그아웃이 시트로 나온다. 홈이 아닌 화면에서는 메뉴가
 * 연두색이다.
 * `activePath`는 로그인 없이 보는 확인용 페이지에서 활성 항목을 지정할 때만 쓴다(기본은 현재 주소).
 */
export function AdminBottomTabBar({ activePath }: { activePath?: string }) {
  const currentPath = usePathname();
  const pathname = activePath ?? currentPath;
  const logout = useAdminLogout();
  // 시트를 연 주소를 기억한다. 주소가 바뀌면(뒤로 가기 등) 자동으로 닫힌 것으로 본다.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const menuOpen = openedAt === pathname;
  const homeActive = isAdminNavActive(pathname, "/admin");

  return (
    <>
      {menuOpen ? (
        <AdminMenuSheet
          pathname={pathname}
          onClose={() => setOpenedAt(null)}
          onLogout={logout}
        />
      ) : null}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-[60px] items-stretch bg-admin-surface shadow-[inset_0_1px_0_0_#e3e3e5] md:hidden">
        <Link
          href="/admin"
          aria-label="홈"
          aria-current={homeActive ? "page" : undefined}
          onClick={() => setOpenedAt(null)}
          className={`flex flex-1 items-center justify-center ${
            homeActive ? "text-admin-attendance-text" : "text-[#b9b9be]"
          }`}
        >
          <TabIcon src="/icons/tab/home.svg" />
        </Link>
        <button
          type="button"
          aria-label="메뉴"
          aria-expanded={menuOpen}
          onClick={() => setOpenedAt(menuOpen ? null : pathname)}
          className={`flex flex-1 items-center justify-center ${
            homeActive ? "text-[#b9b9be]" : "text-admin-attendance-text"
          }`}
        >
          <TabIcon src="/icons/tab/menu.svg" />
        </button>
      </nav>
    </>
  );
}
