import type { Purpose } from "@/lib/admin/purpose";
import { AdminUnauthorizedError, PURPOSE_TO_API } from "@/lib/admin/qr-api";

/** 서버 `Recognition.status`. KNOWN은 서버가 후보 학생과 확인한 경우, UNKNOWN은 못 찾은 경우다. */
export type RecognitionStatus = "KNOWN" | "UNKNOWN" | "NOT_ATTEMPTED";

/** 서버가 KNOWN 얼굴에 출석을 기록한 결과. 웹은 출석을 직접 기록하지 않는다. */
export type RecognitionAttendance =
  "RECORDED" | "DUPLICATE" | "STALE" | "REJECTED";

export type FaceResult = {
  /** 같은 얼굴을 따라가는 익명 트랙. 학생과 무관하다. */
  trackId: string;
  status: RecognitionStatus;
  /** 서버가 알려 주는 학생 이름. KNOWN일 때만 있다. */
  studentName?: string;
  /** 서버가 알려 주는 학번(화면 표시용). KNOWN일 때만 있다. */
  studentNumber?: number;
  attendance?: RecognitionAttendance;
  /** 이 트랙의 인식 시도 횟수(서버가 센다). 매 프레임이 아니라 시도 단위다(REQ-FACE-006). */
  attempts: number;
  /** 서버가 QR 출석을 안내하라고 한 트랙. */
  qrRecommended: boolean;
};

export type FaceFrameResult = { frameId: string; faces: FaceResult[] };

/** 서버가 준 오류. `code`는 서버 ErrorCode 이름(예: `FACE_SESSION_NOT_FOUND`)이고 본문이 없으면 null이다. */
export class FaceApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | null,
  ) {
    super(`face api: ${status} ${code ?? ""}`.trim());
  }
}

type FaceApiBody = {
  frameId: string;
  faces: Array<{
    trackId: string;
    attempts: number;
    qrRecommended: boolean;
    recognition: {
      status: string;
      studentName?: string | null;
      studentNumber?: number | null;
      attendance?: string | null;
    };
  }>;
};

const STATUSES: readonly string[] = ["KNOWN", "UNKNOWN", "NOT_ATTEMPTED"];
const ATTENDANCES: readonly string[] = [
  "RECORDED",
  "DUPLICATE",
  "STALE",
  "REJECTED",
];

function toFaceResult(face: FaceApiBody["faces"][number]): FaceResult {
  const raw = face.recognition;
  const studentName =
    typeof raw.studentName === "string" && raw.studentName.trim() !== ""
      ? raw.studentName
      : undefined;
  const studentNumber =
    typeof raw.studentNumber === "number" && Number.isFinite(raw.studentNumber)
      ? raw.studentNumber
      : undefined;
  let status: RecognitionStatus = STATUSES.includes(raw.status)
    ? (raw.status as RecognitionStatus)
    : "NOT_ATTEMPTED";
  // KNOWN인데 이름이나 학번을 읽을 수 없으면 신원을 만들지 않고 인식하지 못한 것으로 둔다(REQ-FACE-005).
  if (
    status === "KNOWN" &&
    (studentName === undefined || studentNumber === undefined)
  ) {
    status = "UNKNOWN";
  }
  const known = status === "KNOWN";
  return {
    trackId: face.trackId,
    status,
    studentName: known ? studentName : undefined,
    studentNumber: known ? studentNumber : undefined,
    attendance:
      known && raw.attendance && ATTENDANCES.includes(raw.attendance)
        ? (raw.attendance as RecognitionAttendance)
        : undefined,
    attempts: face.attempts,
    qrRecommended: face.qrRecommended,
  };
}

async function failFrom(res: Response): Promise<never> {
  if (res.status === 401) throw new AdminUnauthorizedError();
  const body = (await res.json().catch(() => null)) as {
    code?: unknown;
  } | null;
  throw new FaceApiError(
    res.status,
    typeof body?.code === "string" ? body.code : null,
  );
}

/** REQ-FACE-004: 카메라 페이지마다(용도 탭을 바꿀 때도) 새 세션을 만든다. */
export async function createFaceSession(purpose: Purpose): Promise<string> {
  const res = await fetch("/api/v1/face/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ purpose: PURPOSE_TO_API[purpose] }),
  });
  if (!res.ok) return failFrom(res);
  return ((await res.json()) as { sessionId: string }).sessionId;
}

/**
 * 페이지를 떠날 때도 끝까지 보내려고 `keepalive`를 쓴다. 이미 없는 세션은 서버가 조용히 넘기므로 실패는 무시한다
 * (세션은 서버가 유휴 5분 뒤 정리한다).
 */
export function closeFaceSession(sessionId: string): void {
  void fetch(`/api/v1/face/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
    credentials: "include",
    keepalive: true,
  }).catch(() => {});
}

/**
 * 카메라 프레임 한 장을 서버로 보낸다(JPEG 원본 바이트). 프레임은 보내기만 하고 웹에 저장·기록하지 않는다
 * (개인정보 원본 즉시 폐기). 401은 AdminUnauthorizedError, 그 밖은 서버 code를 담은 FaceApiError다.
 */
export async function sendFaceFrame(
  sessionId: string,
  frame: Blob,
  frameId: string,
): Promise<FaceFrameResult> {
  const res = await fetch(
    `/api/v1/face/sessions/${encodeURIComponent(sessionId)}/frames`,
    {
      method: "POST",
      headers: { "Content-Type": "image/jpeg", "X-Frame-Id": frameId },
      credentials: "include",
      body: frame,
    },
  );
  if (!res.ok) return failFrom(res);
  const body = (await res.json()) as FaceApiBody;
  return { frameId: body.frameId, faces: body.faces.map(toFaceResult) };
}
