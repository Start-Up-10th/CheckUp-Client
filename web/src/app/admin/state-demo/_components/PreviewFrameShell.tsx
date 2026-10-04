"use client";

import { usePathname } from "next/navigation";
import { AdminBottomTabBar } from "@/components/admin/AdminBottomTabBar";
import { AdminRail } from "@/components/admin/AdminRail";

/**
 * 로그인 없이 보는 확인용 프레임의 안쪽 셸. 폭에 따라 패드 레일(768px 이상) 또는 하단 탭바(767px 이하)가 나온다.
 * 활성 메뉴는 보고 있는 확인용 화면(홈 / 봉사자 관리)에 맞춘다. 실제 관리자 레이아웃과 같은 구성이다.
 */
export function PreviewFrameShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activePath = pathname.endsWith("/home")
    ? "/admin"
    : "/admin/volunteers";

  return (
    <div className="flex h-screen w-full bg-admin-bg">
      <AdminRail activePath={activePath} />
      <main className="min-w-0 flex-1 overflow-y-auto pb-[60px] md:pb-0">
        {children}
      </main>
      <AdminBottomTabBar activePath={activePath} />
    </div>
  );
}
