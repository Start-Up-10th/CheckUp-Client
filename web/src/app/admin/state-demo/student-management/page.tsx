import { AdminStudentManagement } from "@/components/admin/student-management/AdminStudentManagement";
import { MockVolunteerProvider } from "../_components/MockVolunteerProvider";

// 로그인 없이 08 · 학생 관리 본문만 보는 확인용 페이지(사이드바 없음).
export default function Page() {
  return (
    <div className="h-screen w-full bg-admin-bg">
      <MockVolunteerProvider>
        <AdminStudentManagement />
      </MockVolunteerProvider>
    </div>
  );
}
