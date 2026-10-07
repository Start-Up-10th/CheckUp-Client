import type { CurrentMember } from "./auth-api";

/**
 * 로그인한 회원이 처음 갈 화면(REQ-AUTH-001·004, DEC-001·055). 로그인 완료 화면과 앱 첫 화면(`/`)이 같이 쓴다.
 * 관리자 권한이 있는 계정은 사용자 앱을 쓰지 않으므로(기숙사 자치위원 포함) 학생 정보가 있어도 항상 `/admin`이다.
 * - 아직 동의하지 않은 학생 → 최초 이용 순서의 다음 화면 `/consent`
 * - 이미 동의한 학생 → 학생 홈 `/main`(얼굴 미등록이면 홈이 얼굴 등록으로 보낸다)
 */
export function homePathFor(member: CurrentMember): string {
  if (member.role === "ADMIN") return "/admin";
  return member.consented ? "/main" : "/consent";
}
