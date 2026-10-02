import { formatCountdown } from "./qr-countdown";

describe("formatCountdown", () => {
  it("분과 초를 두 자리로 쓴다", () => {
    expect(formatCountdown(15 * 60 * 1000)).toBe("15:00");
    expect(formatCountdown(9 * 60 * 1000 + 5 * 1000)).toBe("09:05");
  });

  it("1초 미만 남으면 올려서 아직 남았음을 보여 준다", () => {
    expect(formatCountdown(1)).toBe("00:01");
    expect(formatCountdown(999)).toBe("00:01");
  });

  it("다 지났으면 00:00이고 음수도 00:00이다", () => {
    expect(formatCountdown(0)).toBe("00:00");
    expect(formatCountdown(-5000)).toBe("00:00");
  });
});
