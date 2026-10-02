import { AdminVolunteerRoster } from "@/components/admin/AdminVolunteerRoster";

// 로그인 없이 07 · 봉사자 명단 편집 본문만 보는 확인용 페이지(사이드바 없음).
export default function Page() {
  return (
    <div className="h-screen w-full bg-admin-bg">
      <AdminVolunteerRoster />
    </div>
  );
}
