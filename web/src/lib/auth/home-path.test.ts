import type { CurrentMember } from "./auth-api";
import { homePathFor } from "./home-path";

const member = (overrides: Partial<CurrentMember>): CurrentMember => ({
  name: "홍길동",
  role: "STUDENT",
  consented: true,
  student: null,
  ...overrides,
});

describe("homePathFor", () => {
  it("관리자는 관리자 홈", () => {
    expect(homePathFor(member({ role: "ADMIN", consented: false }))).toBe(
      "/admin",
    );
  });

  it("동의한 학생은 학생 홈", () => {
    expect(homePathFor(member({ consented: true }))).toBe("/main");
  });

  it("동의하지 않은 학생은 동의 화면", () => {
    expect(homePathFor(member({ consented: false }))).toBe("/consent");
  });
});
