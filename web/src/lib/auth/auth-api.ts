/** 서버 회원 역할(CheckUp-server `MemberRole`). 관리자 판정은 서버가 한다(REQ-AUTH-003). */
export type MemberRole = "STUDENT" | "ADMIN";

export type CurrentMember = {
  name: string;
  role: MemberRole;
  /** 필수 동의 두 항목을 마쳤는지(REQ-AUTH-004). 학생이 아니면 false다. */
  consented: boolean;
};

/** DataGSM 로그인을 시작하는 서버 주소. state·PKCE 생성과 콜백 검증은 서버가 한다(REQ-AUTH-001). */
export const LOGIN_START_PATH = "/api/v1/auth/login";

/**
 * `GET /api/v1/auth/me`로 세션 쿠키의 현재 회원을 조회한다(하네스 docs/plans/auth.md).
 * 로그인하지 않았으면(401) null이다. 응답이 계약과 다르거나 서버 오류·네트워크 오류면 오류를 던진다.
 * 서버 응답은 `name`·`role`·`consented`이고, 얼굴 등록 여부는 아직 없다.
 */
export async function fetchCurrentMember(): Promise<CurrentMember | null> {
  const res = await fetch("/api/v1/auth/me", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`authMe: ${res.status}`);
  const body = (await res.json()) as {
    name?: unknown;
    role?: unknown;
    consented?: unknown;
  };
  if (
    typeof body.name !== "string" ||
    (body.role !== "STUDENT" && body.role !== "ADMIN")
  ) {
    throw new Error("authMe: unexpected response");
  }
  // 동의 여부가 빠지면 안전하게 "아직 안 함"으로 본다(동의 화면을 한 번 더 보여 줄 뿐이다).
  return {
    name: body.name,
    role: body.role,
    consented: body.consented === true,
  };
}

/**
 * `POST /api/v1/auth/logout`으로 서버 세션을 끊는다(REQ-AUTH-005). 서버는 세션을 무효화하고 `SESSION`
 * 쿠키를 지운 뒤 204를 준다. 이미 로그아웃된 세션도 성공으로 본다. 그 밖의 응답·네트워크 오류는 던진다.
 */
export async function logout(): Promise<void> {
  const res = await fetch("/api/v1/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`authLogout: ${res.status}`);
}
