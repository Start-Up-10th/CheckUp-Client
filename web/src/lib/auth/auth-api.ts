/** 서버 회원 역할(CheckUp-server `MemberRole`). 관리자 판정은 서버가 한다(REQ-AUTH-003). */
export type MemberRole = "STUDENT" | "ADMIN";

/** 현재 회원의 학생 정보(CheckUp-server#90). 학생 화면의 학번·호실 표시에 쓴다. */
export type CurrentStudent = {
  /** DataGSM 학생 id. `/api/v1/users/{studentId}` 경로에 쓴다. 서버가 받은 적 없으면 null */
  studentId: number | null;
  grade: number;
  classNumber: number;
  number: number;
  /** 화면 표시용 학번(예: 2405) */
  studentNumber: number;
  /** 기숙사 호실 번호. 배정되지 않았으면 null */
  dormitoryRoom: number | null;
  /** 호실로 계산한 층. 호실이 없으면 null */
  dormitoryFloor: number | null;
};

export type CurrentMember = {
  name: string;
  role: MemberRole;
  /** 필수 동의 두 항목을 마쳤는지(REQ-AUTH-004). 학생이 아니면 false다. */
  consented: boolean;
  /** 학생 정보. 학생 정보가 없는 회원(교사)은 null이다. 기숙사 자치위원은 ADMIN이면서 학생 정보가 있다. */
  student: CurrentStudent | null;
};

const isInt = (value: unknown): value is number => Number.isInteger(value);
const isIntOrNull = (value: unknown): value is number | null =>
  value === null || isInt(value);

/** 응답의 `student`. 없거나 null이면 null, 있는데 계약과 다르면 오류다. */
function toCurrentStudent(raw: unknown): CurrentStudent | null {
  if (raw === undefined || raw === null) return null;
  const s = raw as Record<string, unknown>;
  if (
    !isIntOrNull(s.studentId) ||
    !isInt(s.grade) ||
    !isInt(s.classNumber) ||
    !isInt(s.number) ||
    !isInt(s.studentNumber) ||
    !isIntOrNull(s.dormitoryRoom) ||
    !isIntOrNull(s.dormitoryFloor)
  ) {
    throw new Error("authMe: unexpected response");
  }
  return {
    studentId: s.studentId,
    grade: s.grade,
    classNumber: s.classNumber,
    number: s.number,
    studentNumber: s.studentNumber,
    dormitoryRoom: s.dormitoryRoom,
    dormitoryFloor: s.dormitoryFloor,
  };
}

/** DataGSM 로그인을 시작하는 서버 주소. state·PKCE 생성과 콜백 검증은 서버가 한다(REQ-AUTH-001). */
export const LOGIN_START_PATH = "/api/v1/auth/login";

/**
 * `GET /api/v1/auth/me`로 세션 쿠키의 현재 회원을 조회한다(하네스 docs/plans/auth.md).
 * 로그인하지 않았으면(401) null이다. 응답이 계약과 다르거나 서버 오류·네트워크 오류면 오류를 던진다.
 * 서버 응답은 `name`·`role`·`consented`·`student`(학생 정보, 교사는 null)이고, 얼굴 등록 여부는 없다.
 */
export async function fetchCurrentMember(): Promise<CurrentMember | null> {
  const res = await fetch("/api/v1/auth/me", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`authMe: ${res.status}`);
  const body = (await res.json()) as {
    name?: unknown;
    role?: unknown;
    consented?: unknown;
    student?: unknown;
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
    student: toCurrentStudent(body.student),
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
