"use client";

import { createContext, useContext } from "react";
import { adjustVolunteerCountBy } from "@/lib/admin/volunteer-api";
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

/** 서버가 한 번에 받는 횟수 변화의 최대 크기(`VolunteerAdjustRequest.delta`는 -99~99). */
const MAX_DELTA = 99;

/**
 * 실제 서버 API다(`PATCH /api/v1/volunteer/{id}/count`). 화면의 횟수에서 지금 횟수를 뺀 변화를 사유와 함께 보낸다.
 * 변화가 서버 한도(±99)를 넘으면 나눠 차례로 보내고 마지막 학생 상태를 돌려준다.
 */
export const apiStudentManagementGateway: StudentManagementGateway = {
  saveCount: async (student, { count, reason }) => {
    let remaining = count - student.count;
    let latest = student;
    while (remaining !== 0) {
      const step = Math.max(-MAX_DELTA, Math.min(MAX_DELTA, remaining));
      latest = await adjustVolunteerCountBy(student.id, step, reason);
      remaining -= step;
    }
    return latest;
  },
};

const StudentManagementGatewayContext = createContext<StudentManagementGateway>(
  apiStudentManagementGateway,
);

export const StudentManagementGatewayProvider =
  StudentManagementGatewayContext.Provider;

export function useStudentManagementGateway(): StudentManagementGateway {
  return useContext(StudentManagementGatewayContext);
}
