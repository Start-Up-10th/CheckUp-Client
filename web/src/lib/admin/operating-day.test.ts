import { operatingDayLabel } from "./operating-day";

describe("operatingDayLabel", () => {
  it("08:00 이후는 그날 운영일이다", () => {
    // 2026-10-02 08:00 KST = 2026-10-01 23:00Z
    expect(operatingDayLabel(new Date("2026-10-01T23:00:00Z"))).toBe("10/02");
  });

  it("08:00 전은 아직 전날 운영일이다", () => {
    // 2026-10-02 07:59:59 KST = 2026-10-01 22:59:59Z
    expect(operatingDayLabel(new Date("2026-10-01T22:59:59Z"))).toBe("10/01");
  });

  it("자정을 넘겨도 운영일은 바뀌지 않는다", () => {
    // 2026-10-02 00:30 KST = 2026-10-01 15:30Z
    expect(operatingDayLabel(new Date("2026-10-01T15:30:00Z"))).toBe("10/01");
  });

  it("달이 바뀌는 경계도 맞춘다", () => {
    // 2026-11-01 07:00 KST = 2026-10-31 22:00Z → 아직 10/31 운영일
    expect(operatingDayLabel(new Date("2026-10-31T22:00:00Z"))).toBe("10/31");
  });
});
