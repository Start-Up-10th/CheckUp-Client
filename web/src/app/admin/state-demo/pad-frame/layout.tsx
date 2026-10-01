import { AdminRail } from "@/components/admin/AdminRail";

// 로그인 없이 보는 패드 확인용 화면의 안쪽 프레임: 패드 레일 + 본문(봉사자 관리가 활성).
export default function PadFrameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-admin-bg">
      <AdminRail activePath="/admin/volunteers" />
      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
