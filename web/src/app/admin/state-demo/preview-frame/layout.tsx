import { AdminBottomTabBar } from "@/components/admin/AdminBottomTabBar";
import { AdminRail } from "@/components/admin/AdminRail";

// 로그인 없이 보는 패드·핸드폰 확인용 화면의 안쪽 프레임. 폭에 따라 패드 레일(768px 이상) 또는
// 하단 탭바(767px 이하)가 나오고 봉사자 관리가 활성이다. 실제 관리자 레이아웃과 같은 구성이다.
export default function PreviewFrameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-admin-bg">
      <AdminRail activePath="/admin/volunteers" />
      <main className="min-w-0 flex-1 overflow-y-auto pb-[60px] md:pb-0">
        {children}
      </main>
      <AdminBottomTabBar activePath="/admin/volunteers" />
    </div>
  );
}
