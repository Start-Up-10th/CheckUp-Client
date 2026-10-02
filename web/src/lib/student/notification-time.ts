const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** 한국 시각 기준으로 며칠째 날인지. 한국은 서머타임이 없어 UTC+9로 고정해 계산한다. */
function kstDayIndex(ms: number): number {
  return Math.floor((ms + KST_OFFSET_MS) / DAY_MS);
}

/** 한국 시각의 `오전 8:12`·`오후 3:40` 문구. 자정은 오전 12시, 정오는 오후 12시다. */
function kstClockLabel(ms: number): string {
  const kst = new Date(ms + KST_OFFSET_MS);
  const hour = kst.getUTCHours();
  const minute = String(kst.getUTCMinutes()).padStart(2, "0");
  return `${hour < 12 ? "오전" : "오후"} ${hour % 12 || 12}:${minute}`;
}

/**
 * REQ-COM-005: 서버가 준 알림 시각(`createdAt`, ISO-8601 UTC)을 상대 시각 문구로 바꾼다.
 * 명세 예시대로 오늘은 `오늘 오전 8:12`, 어제는 `어제 오후 3:40`, 그보다 전은 `3일 전`이다.
 * 날짜는 기기 시간대와 상관없이 한국 시각의 달력 날짜로 센다 — 어젯밤 11시 알림은 1시간 전이어도 `어제`다.
 * 기기 시계가 서버보다 느려 알림이 미래로 보이면 `오늘`로 둔다. 시각을 읽을 수 없으면 빈 문구다.
 */
export function toNotificationTimeLabel(
  createdAt: string,
  now: Date = new Date(),
): string {
  const createdMs = Date.parse(createdAt);
  if (Number.isNaN(createdMs)) return "";
  const daysAgo = kstDayIndex(now.getTime()) - kstDayIndex(createdMs);
  if (daysAgo <= 0) return `오늘 ${kstClockLabel(createdMs)}`;
  if (daysAgo === 1) return `어제 ${kstClockLabel(createdMs)}`;
  return `${daysAgo}일 전`;
}
