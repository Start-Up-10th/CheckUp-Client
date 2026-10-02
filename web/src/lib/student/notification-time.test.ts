import { toNotificationTimeLabel } from "./notification-time";

// 한국 시각 2026-10-02(금) 15:00
const NOW = new Date("2026-10-02T06:00:00Z");

describe("toNotificationTimeLabel", () => {
  it.each([
    ["오늘 오전", "2026-10-01T23:12:00Z", "오늘 오전 8:12"],
    ["오늘 오후", "2026-10-02T05:05:00Z", "오늘 오후 2:05"],
    ["오늘 자정", "2026-10-01T15:00:00Z", "오늘 오전 12:00"],
    ["오늘 정오", "2026-10-02T03:30:00Z", "오늘 오후 12:30"],
    ["어제 오후", "2026-10-01T06:40:00Z", "어제 오후 3:40"],
    ["어제 밤 11시 59분", "2026-10-01T14:59:00Z", "어제 오후 11:59"],
    ["그제", "2026-09-30T06:00:00Z", "2일 전"],
    ["3일 전", "2026-09-29T01:00:00Z", "3일 전"],
  ])("%s", (_name, createdAt, expected) => {
    expect(toNotificationTimeLabel(createdAt, NOW)).toBe(expected);
  });

  it("날짜는 지난 시간이 아니라 한국 달력 날짜로 센다", () => {
    // 한국 시각 10-03 00:30에 보는 10-02 23:30 알림은 1시간 전이어도 어제다.
    const justAfterMidnight = new Date("2026-10-02T15:30:00Z");

    expect(
      toNotificationTimeLabel("2026-10-02T14:30:00Z", justAfterMidnight),
    ).toBe("어제 오후 11:30");
  });

  it("기기 시계가 느려 알림이 미래로 보이면 오늘로 둔다", () => {
    expect(toNotificationTimeLabel("2026-10-02T15:10:00Z", NOW)).toBe(
      "오늘 오전 12:10",
    );
  });

  it("시각을 읽을 수 없으면 빈 문구", () => {
    expect(toNotificationTimeLabel("", NOW)).toBe("");
    expect(toNotificationTimeLabel("어제", NOW)).toBe("");
  });
});
