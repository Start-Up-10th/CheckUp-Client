"use client";

import { useRouter } from "next/navigation";

// DEC-001: OAuth 연동 전까지 토큰 없이 /admin/login으로 이동만 처리.
// 연동 후에는 이 훅에서 토큰 초기화·서버 로그아웃 API 호출을 추가한다.
export function useAdminLogout() {
  const router = useRouter();
  return () => router.push("/admin/login");
}
