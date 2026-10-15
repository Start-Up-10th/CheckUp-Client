"use client";

import { createContext, useContext } from "react";
import {
  adjustVolunteerCount,
  cancelVolunteerDuty,
  completeVolunteerDuty,
  designateVolunteer,
  fetchVolunteers,
} from "@/lib/admin/volunteer-api";
import type { DutyRecord, RosterStudent } from "@/lib/admin/volunteer-types";

/**
 * 봉사 화면이 서버와 주고받는 동작 모음이다. 기본은 실제 서버 API이고, 로그인 없이 보는 확인용 페이지와
 * 테스트는 Provider로 다른 구현을 넣는다.
 */
export type VolunteerGateway = {
  list: () => Promise<RosterStudent[]>;
  /** 아래 동작은 서버가 바꾼 뒤의 학생 상태를 돌려준다. `id`는 서버 학생 ID(`RosterStudent.id`)다. */
  /** 봉사 횟수를 1회 늘리거나(+1) 줄인다(−1). 호출마다 새 Idempotency-Key를 쓴다. */
  adjustCount: (id: number, delta: 1 | -1) => Promise<RosterStudent>;
  designate: (id: number) => Promise<RosterStudent>;
  cancelDuty: (id: number) => Promise<RosterStudent>;
  completeDuty: (id: number) => Promise<RosterStudent>;
  /**
   * 지난 날짜의 당일 봉사자 기록(달력). 서버에 날짜별 기록 조회 API가 없어 실제 게이트웨이는 비워 두고, 확인용
   * 페이지와 테스트의 목업만 채운다(#334). 비어 있으면 달력은 지난 날짜를 "서버 지원 전"으로 안내한다.
   */
  history?: {
    /** 그 달에서 미이행이 있는 날(`YYYY-MM-DD`)과 그날의 미이행 인원. */
    month: (year: number, month: number) => Promise<Record<string, number>>;
    /** 그 날(`YYYY-MM-DD`)의 기록. */
    day: (date: string) => Promise<DutyRecord[]>;
  };
};

export const apiVolunteerGateway: VolunteerGateway = {
  list: fetchVolunteers,
  adjustCount: (id, delta) => adjustVolunteerCount(id, delta),
  designate: designateVolunteer,
  cancelDuty: cancelVolunteerDuty,
  completeDuty: completeVolunteerDuty,
};

const VolunteerGatewayContext =
  createContext<VolunteerGateway>(apiVolunteerGateway);

export const VolunteerGatewayProvider = VolunteerGatewayContext.Provider;

export function useVolunteerGateway(): VolunteerGateway {
  return useContext(VolunteerGatewayContext);
}
