"use client";

import { useRouter } from "next/navigation";

/**
 * REQ-AUTH-005: 학생 로그아웃 — 확인 없이 DG 로그인 화면으로 간다. 핸드폰 로그아웃 버튼과
 * 노트북 사이드바가 같이 쓴다. `replace`라서 로그아웃 뒤 뒤로가기로 이전 화면에 돌아가지 않는다.
 * TODO(REQ-AUTH-005): 서버 연동 후 로그인 세션과 운영 중인 인증 세션 정리를 여기서 먼저 호출한다.
 */
export function useLogout() {
  const router = useRouter();
  return () => {
    router.replace("/login");
  };
}
