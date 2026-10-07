import type { CurrentMember } from "./auth-api";
import type { LoginApp } from "./login-app";

/**
 * 로그인한 회원이 처음 갈 화면(REQ-AUTH-001·004, DEC-001·047). 로그인 완료 화면과 앱 첫 화면(`/`)이 같이 쓴다.
 * `app`은 어느 앱(PWA)으로 들어왔는지다(기본 사용자 앱). 관리자 앱과 사용자 앱을 따로 설치하므로 앱에 맞는 화면으로 간다.
 * - 관리자 앱으로 들어온 관리자 → `/admin`
 * - 학생 정보가 없는 관리자(사감 등)는 학생 화면을 쓸 수 없어 어느 앱으로 들어와도 `/admin`
 * - 사용자 앱으로 들어온 기숙사 자치위원(관리자이면서 학생) → 학생과 같다. 버튼·메뉴 없이 앱으로 정한다.
 * - 아직 동의하지 않은 학생 → 최초 이용 순서의 다음 화면 `/consent`
 * - 이미 동의한 학생 → 학생 홈 `/main`(얼굴 미등록이면 홈이 얼굴 등록으로 보낸다)
 */
export function homePathFor(
  member: CurrentMember,
  app: LoginApp = "user",
): string {
  if (member.role === "ADMIN" && (app === "admin" || member.student === null)) {
    return "/admin";
  }
  return member.consented ? "/main" : "/consent";
}
