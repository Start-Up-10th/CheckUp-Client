import { AdminVolunteerDuty } from "@/components/admin/AdminVolunteerDuty";
import { MockVolunteerProvider } from "../_components/MockVolunteerProvider";

// 로그인 없이 06 · 봉사자 관리 본문만 보는 확인용 페이지(사이드바 없음).
export default function Page() {
  return (
    <div className="h-screen w-full bg-admin-bg">
      <MockVolunteerProvider>
        <AdminVolunteerDuty rosterHref="/admin/state-demo/volunteer-roster" />
      </MockVolunteerProvider>
    </div>
  );
}
