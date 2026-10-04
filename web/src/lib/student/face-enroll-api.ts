export type FaceStatus = {
  /** 필수 동의(개인정보·얼굴 정보 처리)를 했는지 */
  consented: boolean;
  /** 얼굴 등록 대상인지. 서버는 DataGSM 학생 id와 기숙사 호실이 있는 학생만 대상으로 본다. */
  eligible: boolean;
  /** 얼굴을 이미 등록했는지 */
  enrolled: boolean;
};

/**
 * 등록 요청을 서버가 판정한 결과.
 * - registered: 등록됨(201)
 * - alreadyRegistered: 이미 등록돼 있음(409). 다시 바꾸는 기능은 없다(REQ-FACE-001)
 * - consentRequired: 필수 동의가 먼저 필요함(403 `FACE_CONSENT_REQUIRED`)
 * - notEligible: 얼굴 등록 대상이 아님(403 `FACE_ENROLLMENT_NOT_ELIGIBLE`, 호실 미배정 등)
 * - lowLight: 영상이 어두움(422 `FACE_ENROLLMENT_LOW_LIGHT`)
 * - multipleFaces: 영상에 얼굴이 여러 명(422 `FACE_ENROLLMENT_MULTIPLE_IDENTITIES`)
 * - rejected: 그 밖에 쓸 수 있는 얼굴을 찾지 못함(422 `FACE_ENROLLMENT_REJECTED` 등)
 */
export type FaceEnrollResult =
  | "registered"
  | "alreadyRegistered"
  | "consentRequired"
  | "notEligible"
  | "lowLight"
  | "multipleFaces"
  | "rejected";

/** 로그인이 필요하다(401). */
export class FaceLoginRequiredError extends Error {
  constructor() {
    super("login required");
  }
}

/** 학생 정보가 없는 계정이다(403 `MISSING_STUDENT_INFO`). 교사 계정 등 */
export class FaceNotStudentError extends Error {
  constructor() {
    super("not a student");
  }
}

/** 오류 응답 본문의 `code`(서버 ErrorCode 이름). 본문이 없거나 읽을 수 없으면 null이다. */
async function errorCodeOf(res: Response): Promise<string | null> {
  try {
    const body = (await res.json()) as { code?: unknown };
    return typeof body.code === "string" ? body.code : null;
  } catch {
    return null;
  }
}

/** 서버가 받는 영상 형식. 녹화기가 붙인 코덱 정보(`;codecs=…`)는 떼고 보낸다. */
function videoContentType(video: Blob): string {
  return video.type.toLowerCase().startsWith("video/mp4")
    ? "video/mp4"
    : "video/webm";
}

/**
 * `GET /api/v1/face/me`로 본인의 얼굴 동의·등록 대상·등록 상태를 받는다. 학생은 서버가 로그인 세션으로 정한다.
 * 동의·등록 값이 true가 아니면 "아직 안 함"으로 본다. 등록 대상 값이 없으면(값을 주기 전 서버) 대상으로 보고
 * 등록 요청에서 서버 판정을 받는다. 서버 오류·네트워크 오류는 던진다.
 */
export async function fetchFaceStatus(): Promise<FaceStatus> {
  const res = await fetch("/api/v1/face/me", { credentials: "include" });
  if (res.status === 401) throw new FaceLoginRequiredError();
  if (res.status === 403) throw new FaceNotStudentError();
  if (!res.ok) throw new Error(`faceStatus: ${res.status}`);
  const body = (await res.json()) as {
    consented?: unknown;
    eligible?: unknown;
    enrolled?: unknown;
  };
  return {
    consented: body.consented === true,
    eligible: body.eligible !== false,
    enrolled: body.enrolled === true,
  };
}

/**
 * REQ-FACE-001: `POST /api/v1/face/enrollments`에 촬영한 영상 하나를 원본 바이트 그대로 요청 본문으로 보내
 * 얼굴을 등록한다(CheckUp-server#88 계약). `Content-Type`은 `video/webm` 또는 `video/mp4`이고 20MB 이하다.
 * 서버는 대표 벡터만 저장한다. 학생 ID는 보내지 않는다.
 * 영상은 이 요청 본문으로만 쓰고 웹에 저장·기록하지 않는다(REQ-FACE-002) — 오류 메시지에도 넣지 않는다.
 * 판정이 아닌 실패(영상 형식·크기 오류, 동시 등록 많음, AI 서버 장애, 5xx)와 네트워크 오류는 오류로 던진다.
 */
export async function enrollFace(video: Blob): Promise<FaceEnrollResult> {
  const res = await fetch("/api/v1/face/enrollments", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": videoContentType(video) },
    body: video,
  });
  if (res.ok) return "registered";
  if (res.status === 401) throw new FaceLoginRequiredError();
  if (res.status === 409) return "alreadyRegistered";
  if (res.status === 422) {
    const code = await errorCodeOf(res);
    if (code === "FACE_ENROLLMENT_LOW_LIGHT") return "lowLight";
    if (code === "FACE_ENROLLMENT_MULTIPLE_IDENTITIES") return "multipleFaces";
    return "rejected";
  }
  if (res.status === 403) {
    const code = await errorCodeOf(res);
    if (code === "FACE_CONSENT_REQUIRED") return "consentRequired";
    if (code === "FACE_ENROLLMENT_NOT_ELIGIBLE") return "notEligible";
    throw new FaceNotStudentError();
  }
  throw new Error(`faceEnroll: ${res.status}`);
}
