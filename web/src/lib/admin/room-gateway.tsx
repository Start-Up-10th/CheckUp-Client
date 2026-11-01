"use client";

import { createContext, useContext } from "react";
import type { Floor, Room, Student } from "@/lib/admin/floor-types";
import {
  fetchFloorPlan,
  fetchRoomStudents,
  saveRoomAttendance,
} from "@/lib/admin/room-api";

/**
 * 홈(전개도)이 서버와 주고받는 동작 모음이다. 기본은 실제 서버 API이고, 로그인 없이 보는 확인용 페이지와
 * 테스트는 Provider로 다른 구현을 넣는다.
 */
export type RoomGateway = {
  /** 한 층의 호실별 배정·출석 인원과 학생 명단(호실 번호 오름차순). `date`(`YYYY-MM-DD`)가 없으면 오늘이다. */
  floor: (floor: Floor, date?: string) => Promise<Room[]>;
  /** 호실 학생 명단과 오늘 출석 여부. */
  students: (roomNumber: string, date?: string) => Promise<Student[]>;
  /** 바뀐 학생의 출석 상태를 저장한다. 서버가 호실 학생이 아니라고 하면 오류를 던진다. */
  save: (
    roomNumber: string,
    changes: Array<{ studentId: string; present: boolean }>,
  ) => Promise<void>;
};

export const apiRoomGateway: RoomGateway = {
  floor: fetchFloorPlan,
  students: fetchRoomStudents,
  save: saveRoomAttendance,
};

const RoomGatewayContext = createContext<RoomGateway>(apiRoomGateway);

export const RoomGatewayProvider = RoomGatewayContext.Provider;

export function useRoomGateway(): RoomGateway {
  return useContext(RoomGatewayContext);
}
