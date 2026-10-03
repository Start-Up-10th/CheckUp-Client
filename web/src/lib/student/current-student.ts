"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { fetchCurrentMember, type CurrentMember } from "@/lib/auth/auth-api";

/** 학생 화면에 보이는 본인 정보. 서버 `/api/v1/auth/me`의 `student`로 만든다. */
export type CurrentStudentProfile = {
  name: string;
  /** 화면에 표시하는 학번(예: "2405") */
  studentNumber: string;
  /** 기숙사 층. 호실이 배정되지 않았으면 null */
  floor: number | null;
  /** 호실 번호(예: "412"). 화면에서 "412호"로 붙여 쓴다. 배정되지 않았으면 null */
  roomNumber: string | null;
};

/**
 * 학생 공통 틀이 받아 온 본인 정보 상태.
 * - loading: 받는 중
 * - unauthenticated: 로그인하지 않음(401). 로그인 이동은 각 화면이 정한다(QR은 토큰을 먼저 저장해야 한다)
 * - error: 서버 오류·네트워크 오류
 * - ready: 받음. 학생 정보가 없는 회원(교사)은 profile이 null이다
 */
export type CurrentStudentState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "error" }
  | { status: "ready"; profile: CurrentStudentProfile | null };

export const CurrentStudentContext = createContext<CurrentStudentState>({
  status: "loading",
});

/** 틀 안의 화면(홈 머리·마이페이지 등)이 본인 정보를 꺼내 쓴다. */
export function useCurrentStudent(): CurrentStudentState {
  return useContext(CurrentStudentContext);
}

export function toStudentProfile(
  member: CurrentMember,
): CurrentStudentProfile | null {
  const { student } = member;
  if (!student) return null;
  return {
    name: member.name,
    studentNumber: String(student.studentNumber),
    floor: student.dormitoryFloor,
    roomNumber:
      student.dormitoryRoom === null ? null : String(student.dormitoryRoom),
  };
}

/**
 * REQ-UI-003·004: 화면에 들어올 때 서버에서 본인 정보를 한 번 받는다(`GET /api/v1/auth/me`).
 * 학생은 서버가 로그인 세션으로 정하므로 웹은 학생 ID를 보내지 않는다.
 */
export function useFetchCurrentStudent(): CurrentStudentState {
  const [state, setState] = useState<CurrentStudentState>({
    status: "loading",
  });

  useEffect(() => {
    let cancelled = false;
    fetchCurrentMember()
      .then((member) => {
        if (cancelled) return;
        setState(
          member
            ? { status: "ready", profile: toStudentProfile(member) }
            : { status: "unauthenticated" },
        );
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
