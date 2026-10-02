"use client";

import { createContext, useContext } from "react";
import {
  closeFaceSession,
  createFaceSession,
  sendFaceFrame,
  type FaceFrameResult,
} from "@/lib/admin/face-api";
import type { StudentLabel } from "@/lib/admin/face-results";
import type { Purpose } from "@/lib/admin/purpose";
import { fetchVolunteers } from "@/lib/admin/volunteer-api";

/** DataGSM 학생 id → 학번·이름. 인식 결과에 이름이 없어 성공 행에 이름을 붙일 때 쓴다. */
export type StudentDirectory = Record<number, StudentLabel>;

/**
 * 얼굴 인식 화면이 서버와 주고받는 동작 모음이다. 기본은 실제 서버 API이고, 로그인 없이 보는 확인용 페이지와
 * 테스트는 Provider로 다른 구현을 넣는다.
 */
export type FaceGateway = {
  createSession: (purpose: Purpose) => Promise<string>;
  closeSession: (sessionId: string) => void;
  sendFrame: (
    sessionId: string,
    frame: Blob,
    frameId: string,
  ) => Promise<FaceFrameResult>;
  loadStudents: () => Promise<StudentDirectory>;
};

/**
 * 봉사 관리 명단이 DataGSM 학생 id별 학번·이름을 주므로 그것으로 이름을 찾는다(인식 응답에는 이름이 없다).
 * 얼굴 API가 이름을 주면 이 조회는 필요 없다.
 */
async function loadStudentsFromRoster(): Promise<StudentDirectory> {
  const students = await fetchVolunteers();
  const directory: StudentDirectory = {};
  for (const student of students) {
    const studentNumber = Number(student.studentId);
    // 학번을 읽을 수 없으면 `NaN 이름`이 보이지 않도록 명단에 넣지 않는다(성공 행은 이름 없이 `인식 성공`).
    if (!Number.isFinite(studentNumber)) continue;
    directory[student.id] = { studentNumber, name: student.name };
  }
  return directory;
}

export const apiFaceGateway: FaceGateway = {
  createSession: createFaceSession,
  closeSession: closeFaceSession,
  sendFrame: sendFaceFrame,
  loadStudents: loadStudentsFromRoster,
};

const FaceGatewayContext = createContext<FaceGateway>(apiFaceGateway);

export const FaceGatewayProvider = FaceGatewayContext.Provider;

export function useFaceGateway(): FaceGateway {
  return useContext(FaceGatewayContext);
}
