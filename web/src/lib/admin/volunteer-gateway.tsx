"use client";

import { createContext, useContext } from "react";
import {
  cancelVolunteerDuty,
  completeVolunteerDuty,
  designateVolunteer,
  fetchVolunteers,
} from "@/lib/admin/volunteer-api";
import type { RosterStudent } from "@/lib/admin/volunteer-types";

/**
 * 봉사 화면이 서버와 주고받는 동작 모음이다. 기본은 실제 서버 API이고, 로그인 없이 보는 확인용 페이지와
 * 테스트는 Provider로 다른 구현을 넣는다.
 */
export type VolunteerGateway = {
  list: () => Promise<RosterStudent[]>;
  /** 아래 동작은 서버가 바꾼 뒤의 학생 상태를 돌려준다. `id`는 서버 학생 ID(`RosterStudent.id`)다. */
  designate: (id: number) => Promise<RosterStudent>;
  cancelDuty: (id: number) => Promise<RosterStudent>;
  completeDuty: (id: number) => Promise<RosterStudent>;
};

export const apiVolunteerGateway: VolunteerGateway = {
  list: fetchVolunteers,
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
