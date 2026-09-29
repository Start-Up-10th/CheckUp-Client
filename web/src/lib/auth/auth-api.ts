/** 서버 회원 역할(CheckUp-server `MemberRole`). 관리자 판정은 서버가 한다(REQ-AUTH-003). */
export type MemberRole = "STUDENT" | "ADMIN";

export type CurrentMember = {
  name: string;
  role: MemberRole;
};

/** DataGSM 로그인을 시작하는 서버 주소. state·PKCE 생성과 콜백 검증은 서버가 한다(REQ-AUTH-001). */
export const LOGIN_START_PATH = "/api/v1/auth/login";

/**
 * `GET /api/v1/auth/me`로 세션 쿠키의 현재 회원을 조회한다(하네스 docs/plans/auth.md).
 * 로그인하지 않았으면(401) null이다. 응답이 계약과 다르거나 서버 오류·네트워크 오류면 오류를 던진다.
 * 지금 서버 응답은 `name`, `role`뿐이라 동의·얼굴 등록 여부는 알 수 없다.
 */
export async function fetchCurrentMember(): Promise<CurrentMember | null> {
  const res = await fetch("/api/v1/auth/me", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`authMe: ${res.status}`);
  const body = (await res.json()) as { name?: unknown; role?: unknown };
  if (
    typeof body.name !== "string" ||
    (body.role !== "STUDENT" && body.role !== "ADMIN")
  ) {
    throw new Error("authMe: unexpected response");
  }
  return { name: body.name, role: body.role };
}
