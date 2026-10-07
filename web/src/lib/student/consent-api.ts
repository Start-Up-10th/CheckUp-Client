import { throwIfRateLimited } from "@/lib/rate-limit";
export type ConsentChoices = {
  /** 개인정보 수집 및 이용 동의(필수) */
  privacy: boolean;
  /** 얼굴 정보 처리 동의(필수) */
  face: boolean;
  /** 기숙사 공지 알림 수신(선택) */
  noticeAlarm: boolean;
};

/** 로그인이 필요하다(401). */
export class ConsentLoginRequiredError extends Error {
  constructor() {
    super("login required");
  }
}

/** 학생 정보가 없는 계정이다(403 `MISSING_STUDENT_INFO`). 교사 계정 등 */
export class ConsentNotStudentError extends Error {
  constructor() {
    super("not a student");
  }
}

/**
 * REQ-AUTH-004: `POST /api/v1/consent`로 동의를 저장한다(CheckUp-server#61). 성공은 204다.
 * 동의할 학생은 서버가 로그인 세션으로 정하므로 학생 ID는 보내지 않는다. 필수 항목이 빠지거나 false면
 * 서버가 400을 주지만, 화면이 필수 두 항목을 켜야만 버튼을 열어 주므로 정상 흐름에서는 생기지 않는다.
 * 다시 보내면 서버는 처음 동의 시각을 유지하고 공지 알림 수신만 바꾼다.
 */
export async function submitConsent(choices: ConsentChoices): Promise<void> {
  const res = await fetch("/api/v1/consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(choices),
  });
  if (res.status === 401) throw new ConsentLoginRequiredError();
  if (res.status === 403) throw new ConsentNotStudentError();
  throwIfRateLimited(res);
  if (!res.ok) throw new Error(`consent: ${res.status}`);
}
