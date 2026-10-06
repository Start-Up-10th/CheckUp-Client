"use client";

import type { ReactNode } from "react";
import { RoomGatewayProvider } from "@/lib/admin/room-gateway";
import { createMockRoomGateway } from "@/lib/admin/room-mock-gateway";

const MOCK_GATEWAY = createMockRoomGateway();

/** 로그인 없이 보는 확인용 페이지가 서버 대신 목업 호실을 쓰게 한다. 운영 화면에는 쓰지 않는다. */
export function MockRoomProvider({ children }: { children: ReactNode }) {
  return (
    <RoomGatewayProvider value={MOCK_GATEWAY}>{children}</RoomGatewayProvider>
  );
}
