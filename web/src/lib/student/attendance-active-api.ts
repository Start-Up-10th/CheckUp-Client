import { throwIfRateLimited } from "@/lib/rate-limit";

/** 용도별로 지금 출석을 받는 중인지. 세션 id·관리자·토큰은 받지 않고 여부만 받는다. */
export type AttendanceActive = { dormitory: boolean; studyRoom: boolean };

/**
 * REQ-ATT-001: `GET /api/v1/attendance/active`로 지금 출석을 받는 중인지 용도별로 받는다(CheckUp-server#260, #261).
 * 출석은 시간표가 없고 관리자가 QR·얼굴 인식 페이지를 연 동안만 받으므로, 서버가 살아 있는 QR 세션과 학생 본인 층의
 * 활성 얼굴 인식 세션으로 판정한다. 429는 `RateLimitedError`, 그 밖의 실패(401·403 포함)와 계약과 다른 응답은 오류로 던진다.
 */
export async function fetchAttendanceActive(): Promise<AttendanceActive> {
  const res = await fetch("/api/v1/attendance/active", {
    credentials: "include",
  });
  throwIfRateLimited(res);
  if (!res.ok) throw new Error(`attendanceActive: ${res.status}`);
  const { dormitory, studyRoom } = ((await res.json()) ?? {}) as Record<
    string,
    unknown
  >;
  if (typeof dormitory !== "boolean" || typeof studyRoom !== "boolean") {
    throw new Error("attendanceActive: unexpected response");
  }
  return { dormitory, studyRoom };
}
