"use client";

import { createContext, useContext } from "react";
import {
  adjustMissedDuty,
  adjustVolunteerCount,
  cancelVolunteerDuty,
  completeVolunteerDuty,
  designateVolunteer,
  fetchDutyRecords,
  fetchMissedSummary,
  fetchVolunteers,
  markVolunteerMissed,
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
   * 오늘 지정을 미이행으로 바꾸고 횟수 변화(`delta`, 0이면 그대로)와 사유를 한 번에 저장한다. 지정은 삭제하지 않고
   * `미이행`으로 남는다(서버 `POST /duty/missed`, #336).
   */
  markMissed: (
    id: number,
    delta: number,
    reason: string,
  ) => Promise<RosterStudent>;
  /** 지난 날짜(`YYYY-MM-DD`)의 지정을 미이행으로 처리하거나 횟수·사유를 저장한다(서버 `PATCH /duties/{date}/{id}/missed`). */
  adjustMissed: (
    date: string,
    id: number,
    delta: number,
    reason: string,
  ) => Promise<DutyRecord>;
  /**
   * 날짜별 당일 봉사자 기록(달력). 서버 `GET /duties`·`/duties/summary`에 연결한다. 이 값이 없는 게이트웨이(일부
   * 테스트)에서는 달력이 지난 날짜를 "서버 지원 전"으로 안내한다.
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
  markMissed: markVolunteerMissed,
  adjustMissed: adjustMissedDuty,
  history: { month: fetchMissedSummary, day: fetchDutyRecords },
};

const VolunteerGatewayContext =
  createContext<VolunteerGateway>(apiVolunteerGateway);

export const VolunteerGatewayProvider = VolunteerGatewayContext.Provider;

export function useVolunteerGateway(): VolunteerGateway {
  return useContext(VolunteerGatewayContext);
}
