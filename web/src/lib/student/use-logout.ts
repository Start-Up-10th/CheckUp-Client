"use client";

import { useRouter } from "next/navigation";

/**
 * REQ-AUTH-005: 학생 로그아웃 — 확인 없이 DG 로그인 화면으로 간다. 핸드폰 로그아웃 버튼과
 * 노트북 사이드바가 같이 쓴다. `replace`는 현재 기록 한 칸만 바꾸므로, 뒤로가기로 직전 화면
 * (로그아웃을 누른 `/my` 등)에는 돌아가지 않지만 그보다 앞의 학생 화면(`/main` 등)으로는 갈 수 있다.
 * TODO(REQ-AUTH-005): 서버 연동 후 로그인 세션과 운영 중인 인증 세션 정리를 여기서 먼저 호출한다.
 * 로그아웃 뒤 학생 화면 접근 자체를 막는 일은 그 세션 정리·인증 확인이 맡는다.
 */
export function useLogout() {
  const router = useRouter();
  return () => {
    router.replace("/login");
  };
}
