"use client";

import type { ReactNode } from "react";
import { VolunteerGatewayProvider } from "@/lib/admin/volunteer-gateway";
import { StudentManagementGatewayProvider } from "@/lib/admin/student-management-gateway";
import { createMockStudentManagementGateway } from "@/lib/admin/student-management-mock-gateway";
import { createMockVolunteerGateway } from "@/lib/admin/volunteer-mock-gateway";

const MOCK_GATEWAY = createMockVolunteerGateway();
const MOCK_STUDENT_MANAGEMENT = createMockStudentManagementGateway();

/** 로그인 없이 보는 확인용 페이지가 서버 대신 목업 명단을 쓰게 한다. 운영 화면에는 쓰지 않는다. */
export function MockVolunteerProvider({ children }: { children: ReactNode }) {
  return (
    <VolunteerGatewayProvider value={MOCK_GATEWAY}>
      <StudentManagementGatewayProvider value={MOCK_STUDENT_MANAGEMENT}>
        {children}
      </StudentManagementGatewayProvider>
    </VolunteerGatewayProvider>
  );
}
