"use client";

import { createContext, useContext } from "react";
import { operatingDayLabel } from "@/lib/admin/operating-day";
import type { RosterStudent } from "@/lib/admin/volunteer-types";

/** 학생 상세 다이얼로그에서 정한 값. 횟수는 바뀐 뒤의 값이고 사유는 비어 있을 수 있다. */
export type StudentCountChange = { count: number; reason: string };

/**
 * 학생 관리(Figma 08)가 서버와 주고받는 동작이다. 학생 목록은 봉사 명단 저장소(`useVolunteerRoster`)가 서버에서
 * 받는다.
 */
export type StudentManagementGateway = {
  /** 횟수와 사유를 한 번에 저장하고 바뀐 뒤의 학생 상태를 돌려준다. */
  saveCount: (
    student: RosterStudent,
    change: StudentCountChange,
  ) => Promise<RosterStudent>;
};

/**
 * 개발용 대역이다. 서버에 사유를 받는 횟수 일괄 변경 API가 아직 없어서(서버 봉사 API는 1회씩 `increase`/`decrease`만
 * 있다) 서버를 부르지 않고 화면 안 명단만 바꾼다. 서버 연동이 아니므로 이 API가 생기면 이 대역을 실제 호출로 바꾼다.
 */
export const devStudentManagementGateway: StudentManagementGateway = {
  saveCount: async (student, { count }) => ({
    ...student,
    count,
    lastActivityDate: operatingDayLabel(new Date()),
  }),
};

const StudentManagementGatewayContext = createContext<StudentManagementGateway>(
  devStudentManagementGateway,
);

export const StudentManagementGatewayProvider =
  StudentManagementGatewayContext.Provider;

export function useStudentManagementGateway(): StudentManagementGateway {
  return useContext(StudentManagementGatewayContext);
}
