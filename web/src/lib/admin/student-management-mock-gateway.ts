import { operatingDayLabel } from "@/lib/admin/operating-day";
import type { StudentManagementGateway } from "@/lib/admin/student-management-gateway";

/**
 * 서버를 부르지 않고 화면 안 명단만 바꾸는 목업이다. 로그인 없이 보는 확인용 페이지와 화면 테스트가 쓰고 운영 화면에는
 * 쓰지 않는다.
 */
export function createMockStudentManagementGateway(): StudentManagementGateway {
  return {
    saveCount: async (student, { count }) => ({
      ...student,
      count,
      lastActivityDate: operatingDayLabel(new Date()),
    }),
  };
}
