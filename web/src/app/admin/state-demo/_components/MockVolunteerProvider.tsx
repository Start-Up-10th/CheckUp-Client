"use client";

import type { ReactNode } from "react";
import { MOCK_VOLUNTEER_ROSTER } from "@/lib/admin/mock-volunteer-roster";
import {
  VolunteerGatewayProvider,
  type VolunteerGateway,
} from "@/lib/admin/volunteer-gateway";

const MOCK_GATEWAY: VolunteerGateway = {
  list: async () => MOCK_VOLUNTEER_ROSTER,
};

/** 로그인 없이 보는 확인용 페이지가 서버 대신 목업 명단을 쓰게 한다. 운영 화면에는 쓰지 않는다. */
export function MockVolunteerProvider({ children }: { children: ReactNode }) {
  return (
    <VolunteerGatewayProvider value={MOCK_GATEWAY}>
      {children}
    </VolunteerGatewayProvider>
  );
}
