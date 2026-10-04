const OPERATING_DAY_START_HOUR = 8;

const MONTH_DAY = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "2-digit",
  day: "2-digit",
});

/**
 * 운영일은 Asia/Seoul 08:00부터 다음 날 07:59:59까지다(DEC-006). 08:00 전이면 아직 전날 운영일이다.
 * 서버와 브라우저의 시간대가 달라도 같은 값이 나오도록 시간대를 직접 정한다.
 * 예: 2026-10-02 07:59 KST → `10/01`, 08:00 KST → `10/02`.
 */
export function operatingDayLabel(now: Date): string {
  const shifted = new Date(
    now.getTime() - OPERATING_DAY_START_HOUR * 60 * 60 * 1000,
  );
  const parts = MONTH_DAY.formatToParts(shifted);
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  return `${month}/${day}`;
}
