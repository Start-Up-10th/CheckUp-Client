"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth/auth-api";

/**
 * REQ-AUTH-005: 관리자 로그아웃 — 서버 세션을 끊고(`POST /api/v1/auth/logout`) 관리자 로그인 화면으로 간다.
 * 서버 요청이 실패해도(네트워크 오류 등) 화면은 떠난다. 남은 세션은 서버 세션 만료로 정리된다.
 * `replace`라 뒤로가기로 직전 관리자 화면에 돌아오지 않는다.
 */
export function useAdminLogout() {
  const router = useRouter();
  return () => {
    logout()
      .catch(() => {})
      .finally(() => router.replace("/admin/login"));
  };
}
