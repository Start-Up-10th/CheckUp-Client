export type FaceStatus = {
  /** 얼굴 정보 처리 동의를 했는지 */
  consented: boolean;
  /** 얼굴을 이미 등록했는지 */
  enrolled: boolean;
};

/**
 * 등록 요청을 서버가 판정한 결과.
 * - registered: 등록됨(201)
 * - alreadyRegistered: 이미 등록돼 있음(409). 다시 바꾸는 기능은 없다(REQ-FACE-001)
 * - consentRequired: 얼굴 정보 처리 동의가 먼저 필요함(403 `FACE_CONSENT_REQUIRED`)
 * - rejected: 영상에서 쓸 수 있는 얼굴을 찾지 못함(422). 다시 촬영하면 될 수 있다
 */
export type FaceEnrollResult =
  "registered" | "alreadyRegistered" | "consentRequired" | "rejected";

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

/**
 * `GET /api/v1/face/me`로 본인의 얼굴 동의·등록 상태를 받는다. 학생은 서버가 로그인 세션으로 정한다.
 * 값이 true가 아니면 안전하게 "아직 안 함"으로 본다. 서버 오류·네트워크 오류는 던진다.
 */
export async function fetchFaceStatus(): Promise<FaceStatus> {
  const res = await fetch("/api/v1/face/me", { credentials: "include" });
  if (res.status === 401) throw new FaceLoginRequiredError();
  if (res.status === 403) throw new FaceNotStudentError();
  if (!res.ok) throw new Error(`faceStatus: ${res.status}`);
  const body = (await res.json()) as {
    consented?: unknown;
    enrolled?: unknown;
  };
  return {
    consented: body.consented === true,
    enrolled: body.enrolled === true,
  };
}

/**
 * REQ-FACE-001: `POST /api/v1/face/enrollments`에 촬영한 영상 하나를 multipart `video`로 보내 얼굴을 등록한다.
 * 서버는 `video/webm`·`video/mp4`만 받고(20MB 이하) 대표 벡터만 저장한다. 학생 ID는 보내지 않는다.
 * 영상은 이 요청 본문으로만 쓰고 웹에 저장·기록하지 않는다(REQ-FACE-002) — 오류 메시지에도 넣지 않는다.
 * 서버는 AI의 거절 사유(얼굴 없음·조명 어두움·여러 사람)를 422 하나로 돌려줘 사유를 구분할 수 없다.
 * 판정이 아닌 실패(영상 형식·크기 오류, AI 서버 장애, 5xx)와 네트워크 오류는 오류로 던진다.
 */
export async function enrollFace(video: Blob): Promise<FaceEnrollResult> {
  const form = new FormData();
  form.append(
    "video",
    video,
    video.type.startsWith("video/mp4") ? "face.mp4" : "face.webm",
  );
  const res = await fetch("/api/v1/face/enrollments", {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (res.ok) return "registered";
  if (res.status === 401) throw new FaceLoginRequiredError();
  if (res.status === 409) return "alreadyRegistered";
  if (res.status === 422) return "rejected";
  if (res.status === 403) {
    if ((await errorCodeOf(res)) === "FACE_CONSENT_REQUIRED") {
      return "consentRequired";
    }
    throw new FaceNotStudentError();
  }
  throw new Error(`faceEnroll: ${res.status}`);
}
