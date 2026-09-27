import { toQrAttendanceResult } from "./qr-attendance-result";

describe("toQrAttendanceResult", () => {
  it.each([
    ["APPROVED", "approved"],
    ["DUPLICATE", "duplicate"],
    ["EXPIRED", "expired"],
    ["CLOSED", "closed"],
    ["INVALID", "invalid"],
  ] as const)("%s → %s", (apiResult, expected) => {
    expect(toQrAttendanceResult(apiResult)).toBe(expected);
  });

  it("계약에 없는 값은 invalid로 본다", () => {
    expect(toQrAttendanceResult("SUCCESS")).toBe("invalid");
    expect(toQrAttendanceResult("")).toBe("invalid");
  });

  it("소문자 값은 계약 값이 아니므로 invalid", () => {
    expect(toQrAttendanceResult("approved")).toBe("invalid");
  });

  it("객체 기본 속성 이름도 invalid", () => {
    expect(toQrAttendanceResult("toString")).toBe("invalid");
    expect(toQrAttendanceResult("__proto__")).toBe("invalid");
  });
});
