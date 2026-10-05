import type { Metadata } from "next";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminRail } from "@/components/admin/AdminRail";
import { AdminBottomTabBar } from "@/components/admin/AdminBottomTabBar";

/**
 * 반응형 기준: 기기별로 라우트를 나누지 않고 한 페이지를 반응형으로 처리한다.
 * ~767px 관리자-핸드폰(아이콘 전용 하단 바 2칸: 홈·메뉴, 메뉴는 시트로 열린다) · 768~1279px 관리자-패드(96px 레일) · 1280px~ 관리자-컴퓨터(사이드바 300px).
 * 메뉴 구성(홈·QR 코드 생성·얼굴 인식 생성·봉사자 관리·학생 관리)은 세 구간 모두 동일하고 표현 방식만 바뀐다.
 * 관리자 화면 전체를 AdminAuthGate가 감싸 관리자 세션일 때만 보여 준다(REQ-AUTH-001·003).
 */
export const metadata: Metadata = {
  // /admin 전용 manifest로 덮어써 관리자를 학생용 앱과 별도로 설치할 수 있게 한다(DEC-025).
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
    <AdminAuthGate>
      <div className="flex h-screen w-full bg-admin-bg">
        <AdminSidebar />
        <AdminRail />
        <main className="min-w-0 flex-1 overflow-y-auto pb-[60px] md:pb-0">
          {children}
        </main>
        <AdminBottomTabBar />
      </div>
    </AdminAuthGate>
  );
}
