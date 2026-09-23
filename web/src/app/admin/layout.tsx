import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminRail } from "@/components/admin/AdminRail";
import { AdminBottomTabBar } from "@/components/admin/AdminBottomTabBar";
import { AdminMobileLogoutButton } from "@/components/admin/AdminMobileLogoutButton";

/**
 * 반응형 기준: 기기별로 라우트를 나누지 않고 한 페이지를 반응형으로 처리한다.
 * ~767px 관리자-핸드폰(하단 탭바 4개) · 768~1279px 관리자-패드(축소 레일) · 1280px~ 관리자-컴퓨터(사이드바 300px).
 * 메뉴 구성(홈·QR 코드 생성·얼굴 인식 생성·봉사자 관리)은 세 구간 모두 동일하고 표현 방식만 바뀐다.
 * 관리자 인증 가드는 서버 세션이 준비되는 P2에서 연결한다 (현재는 UI만 구현).
 */
export const metadata: Metadata = {
  // /admin 전용 manifest로 덮어써 관리자를 학생용 앱과 별도로 설치할 수 있게 한다(DEC-023).
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "관리자",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-admin-bg">
      <AdminSidebar />
      <AdminRail />
      <main className="min-w-0 flex-1 overflow-y-auto pb-16 md:pb-0">
        {children}
      </main>
      <AdminBottomTabBar />
      <AdminMobileLogoutButton />
    </div>
  );
}
