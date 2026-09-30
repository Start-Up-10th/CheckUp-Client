"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth/auth-api";

/**
 * REQ-AUTH-005: 학생 로그아웃 — 확인 없이 서버 세션을 끊고(`POST /api/v1/auth/logout`) DG 로그인
 * 화면으로 간다. 핸드폰 로그아웃 버튼과 노트북 사이드바가 같이 쓴다.
 * 서버 요청이 실패해도(네트워크 오류 등) 로그인 화면으로는 보낸다 — 학생이 누른 뜻대로 화면을 떠나고,
 * 남은 세션은 서버 세션 만료로 정리된다.
 * `replace`는 현재 기록 한 칸만 바꾸므로, 뒤로가기로 직전 화면(로그아웃을 누른 `/my` 등)에는 돌아가지
 * 않는다. 로그아웃 뒤 학생 화면 접근 자체를 막는 일은 화면별 로그인 확인이 맡는다(아직 없음).
 */
export function useLogout() {
  const router = useRouter();
  return () => {
    logout()
      .catch(() => {})
      .finally(() => router.replace("/login"));
  };
}
