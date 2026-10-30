"use client";

import { createContext, useContext } from "react";
import {
  adjustConsecutiveCountBy,
  adjustVolunteerCountBy,
} from "@/lib/admin/volunteer-api";
import type { RosterStudent } from "@/lib/admin/volunteer-types";

/**
 * 저장할 변경. 횟수는 바뀐 뒤의 값이고 다이얼로그를 연 때와 달라진 칸만 들어 있다. 없는 칸은 서버 값을 건드리지
 * 않는다. 사유는 비어 있을 수 있다.
 */
export type StudentCountChange = {
  count?: number;
  consecutiveCount?: number;
  reason: string;
};

/**
 * 저장 도중 일부만 서버에 반영되고 실패했다. `saved`는 다이얼로그를 연 때의 학생에 반영된 변화만큼 더한 값으로,
 * 다시 저장할 때 이 값을 기준으로 삼으면 같은 변화를 두 번 보내지 않는다. `latest`는 서버가 마지막으로 준 학생 상태,
 * `failed`는 실패한 칸, `cause`는 원래 오류다.
 */
export class PartialSaveError extends Error {
  constructor(
    readonly saved: RosterStudent,
    readonly latest: RosterStudent,
    readonly failed: "count" | "consecutive",
    readonly cause: unknown,
  ) {
    super("student count: partially saved");
  }
}

/**
 * 학생 관리(Figma 08)가 서버와 주고받는 동작이다. 학생 목록은 봉사 명단 저장소(`useVolunteerRoster`)가 서버에서
 * 받는다.
 */
export type StudentManagementGateway = {
  /**
   * `student`(다이얼로그를 연 때의 학생)에서 관리자가 바꾼 만큼을 저장하고 바뀐 뒤의 학생 상태를 돌려준다. 일부만
   * 반영되고 실패하면 `PartialSaveError`를 던진다.
   */
  saveCount: (
    student: RosterStudent,
    change: StudentCountChange,
  ) => Promise<RosterStudent>;
};

/** 서버가 한 번에 받는 횟수 변화의 최대 크기(`VolunteerAdjustRequest.delta`는 -99~99). */
const MAX_DELTA = 99;

/**
 * 실제 서버 API다. 다이얼로그를 연 때의 횟수에서 관리자가 바꾼 만큼(변화량)을 사유와 함께 일반은
 * `PATCH /api/v1/volunteer/{id}/count`, 연속 봉사는 `PATCH /consecutive/count`로 따로 보낸다. 서버도 변화량만 받으므로
 * 그사이 다른 곳의 `완료` 같은 변경은 지우지 않는다. 변화가 서버 한도(±99)를 넘으면 나눠 차례로 보낸다.
 */
export const apiStudentManagementGateway: StudentManagementGateway = {
  saveCount: async (student, { count, reason, consecutiveCount }) => {
    const saved = { ...student };
    let latest = student;
    let field: "count" | "consecutive" = "count";
    try {
      if (count !== undefined) {
        for (const step of steps(count - student.count)) {
          latest = await adjustVolunteerCountBy(student.id, step, reason);
          saved.count += step;
        }
      }
      field = "consecutive";
      if (consecutiveCount !== undefined) {
        for (const step of steps(
          consecutiveCount - (student.consecutiveCount ?? 0),
        )) {
          latest = await adjustConsecutiveCountBy(student.id, step, reason);
          saved.consecutiveCount = (saved.consecutiveCount ?? 0) + step;
        }
      }
    } catch (error) {
      if (latest === student) throw error;
      throw new PartialSaveError(saved, latest, field, error);
    }
    return latest;
  },
};

/** 변화를 서버 한도(±99) 안의 조각으로 나눈다. 0이면 빈 배열이다. */
function steps(delta: number): number[] {
  const result: number[] = [];
  for (let remaining = delta; remaining !== 0;) {
    const step = Math.max(-MAX_DELTA, Math.min(MAX_DELTA, remaining));
    result.push(step);
    remaining -= step;
  }
  return result;
}

const StudentManagementGatewayContext = createContext<StudentManagementGateway>(
  apiStudentManagementGateway,
);

export const StudentManagementGatewayProvider =
  StudentManagementGatewayContext.Provider;

export function useStudentManagementGateway(): StudentManagementGateway {
  return useContext(StudentManagementGatewayContext);
}
