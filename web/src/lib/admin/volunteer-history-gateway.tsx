"use client";

import { createContext, useContext } from "react";
import {
  fetchVolunteerAdjustments,
  type VolunteerAdjustment,
} from "@/lib/admin/volunteer-api";
import type { RosterStudent } from "@/lib/admin/volunteer-types";

/** 봉사 이력 한 줄(Figma 07 학생 상세). 날짜는 `MM/DD`, 변화는 실제로 바뀐 횟수(양수 적립·음수 감면)다. */
export type VolunteerHistoryItem = VolunteerAdjustment;

/** 학생 상세 다이얼로그가 서버에서 받는 봉사 이력. */
export type VolunteerHistoryGateway = {
  list: (student: RosterStudent) => Promise<VolunteerHistoryItem[]>;
};

/** 실제 서버 API다(`GET /api/v1/volunteer/{id}/adjustments`, 최신순). */
export const apiVolunteerHistoryGateway: VolunteerHistoryGateway = {
  list: (student) => fetchVolunteerAdjustments(student.id),
};

const VolunteerHistoryGatewayContext = createContext<VolunteerHistoryGateway>(
  apiVolunteerHistoryGateway,
);

export const VolunteerHistoryGatewayProvider =
  VolunteerHistoryGatewayContext.Provider;

export function useVolunteerHistoryGateway(): VolunteerHistoryGateway {
  return useContext(VolunteerHistoryGatewayContext);
}
