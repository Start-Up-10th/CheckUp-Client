"use client";

import { createContext, useContext } from "react";
import { fetchVolunteers } from "@/lib/admin/volunteer-api";
import type { RosterStudent } from "@/lib/admin/volunteer-types";

/**
 * 봉사 화면이 서버와 주고받는 동작 모음이다. 기본은 실제 서버 API이고, 로그인 없이 보는 확인용 페이지와
 * 테스트는 Provider로 다른 구현을 넣는다.
 */
export type VolunteerGateway = {
  list: () => Promise<RosterStudent[]>;
};

export const apiVolunteerGateway: VolunteerGateway = {
  list: fetchVolunteers,
};

const VolunteerGatewayContext =
  createContext<VolunteerGateway>(apiVolunteerGateway);

export const VolunteerGatewayProvider = VolunteerGatewayContext.Provider;

export function useVolunteerGateway(): VolunteerGateway {
  return useContext(VolunteerGatewayContext);
}
