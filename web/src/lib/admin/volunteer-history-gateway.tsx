"use client";

import { createContext, useContext } from "react";
import type { RosterStudent } from "@/lib/admin/volunteer-types";

/** 봉사 이력 한 줄(Figma 07 학생 상세). 날짜는 `MM/DD`, 변화는 적립 +1·감면 −1이다. */
export type VolunteerHistoryItem = {
  id: string;
  date: string;
  title: string;
  delta: 1 | -1;
};

/** 학생 상세 다이얼로그가 서버에서 받는 봉사 이력. */
export type VolunteerHistoryGateway = {
  list: (student: RosterStudent) => Promise<VolunteerHistoryItem[]>;
};

/**
 * 개발용 대역이다. 서버 봉사 이력 API(`GET /api/v1/users/{studentId}/volunteer/history`)는 완료한 운영일만 주고
 * 활동명·감면(−1) 기록이 없어 Figma 이력(날짜·활동명·±횟수)을 그릴 수 없다. 그래서 서버를 부르지 않고 Figma 예시 값을
 * 모든 학생에게 똑같이 보여 준다. 서버 계약이 정해지면 실제 호출로 바꾼다.
 */
export const devVolunteerHistoryGateway: VolunteerHistoryGateway = {
  list: async () => [
    { id: "10/01", date: "10/01", title: "도서관 정리 봉사", delta: 1 },
    { id: "09/24", date: "09/24", title: "생활관 규정 위반", delta: -1 },
    { id: "09/17", date: "09/17", title: "급식실 봉사", delta: 1 },
    { id: "09/03", date: "09/03", title: "교내 청소", delta: 1 },
  ],
};

const VolunteerHistoryGatewayContext = createContext<VolunteerHistoryGateway>(
  devVolunteerHistoryGateway,
);

export const VolunteerHistoryGatewayProvider =
  VolunteerHistoryGatewayContext.Provider;

export function useVolunteerHistoryGateway(): VolunteerHistoryGateway {
  return useContext(VolunteerHistoryGatewayContext);
}
