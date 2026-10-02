"use client";

import type { ReactNode } from "react";
import { VolunteerGatewayProvider } from "@/lib/admin/volunteer-gateway";
import { createMockVolunteerGateway } from "@/lib/admin/volunteer-mock-gateway";

const MOCK_GATEWAY = createMockVolunteerGateway();

/** 로그인 없이 보는 확인용 페이지가 서버 대신 목업 명단을 쓰게 한다. 운영 화면에는 쓰지 않는다. */
export function MockVolunteerProvider({ children }: { children: ReactNode }) {
  return (
    <VolunteerGatewayProvider value={MOCK_GATEWAY}>
      {children}
    </VolunteerGatewayProvider>
  );
}
