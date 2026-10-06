"use client";

import type { ReactNode } from "react";
import type { RoomGateway } from "@/lib/admin/room-gateway";
import { RoomGatewayProvider } from "@/lib/admin/room-gateway";
import { createMockRoomGateway } from "@/lib/admin/room-mock-gateway";

/** 목업이 바로 답하면 로딩 스켈레톤이 보이지 않아서, 확인용 페이지에서만 서버처럼 잠깐 기다린다. */
const MOCK_DELAY_MS = 700;

function withDelay(gateway: RoomGateway): RoomGateway {
  const wait = () =>
    new Promise<void>((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  return {
    floor: async (floor) => {
      await wait();
      return gateway.floor(floor);
    },
    students: async (roomNumber) => {
      await wait();
      return gateway.students(roomNumber);
    },
    save: async (roomNumber, changes) => {
      await wait();
      return gateway.save(roomNumber, changes);
    },
  };
}

const MOCK_GATEWAY = withDelay(createMockRoomGateway());

/** 로그인 없이 보는 확인용 페이지가 서버 대신 목업 호실을 쓰게 한다. 운영 화면에는 쓰지 않는다. */
export function MockRoomProvider({ children }: { children: ReactNode }) {
  return (
    <RoomGatewayProvider value={MOCK_GATEWAY}>{children}</RoomGatewayProvider>
  );
}
