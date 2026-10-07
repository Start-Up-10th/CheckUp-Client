import type { CurrentMember } from "./auth-api";
import { homePathFor } from "./home-path";

const member = (overrides: Partial<CurrentMember>): CurrentMember => ({
  name: "홍길동",
  role: "STUDENT",
  consented: true,
  student: null,
  ...overrides,
});

/** 기숙사 자치위원처럼 학생 정보가 있는 회원. */
const STUDENT_INFO: CurrentMember["student"] = {
  studentId: 17,
  grade: 2,
  classNumber: 4,
  number: 5,
  studentNumber: 2405,
  dormitoryRoom: 412,
  dormitoryFloor: 4,
};

describe("homePathFor", () => {
  it("학생 정보가 없는 관리자(사감 등)는 어느 앱으로 들어와도 관리자 홈", () => {
    const admin = member({ role: "ADMIN", consented: false });

    expect(homePathFor(admin)).toBe("/admin");
    expect(homePathFor(admin, "user")).toBe("/admin");
    expect(homePathFor(admin, "admin")).toBe("/admin");
  });

  it("동의한 학생은 학생 홈", () => {
    expect(homePathFor(member({ consented: true }))).toBe("/main");
  });

  it("동의하지 않은 학생은 동의 화면", () => {
    expect(homePathFor(member({ consented: false }))).toBe("/consent");
  });

  describe("기숙사 자치위원(관리자이면서 학생)", () => {
    const committee = (consented: boolean) =>
      member({ role: "ADMIN", consented, student: STUDENT_INFO });

    it("관리자 앱으로 들어오면 관리자 홈", () => {
      expect(homePathFor(committee(true), "admin")).toBe("/admin");
    });

    it("사용자 앱으로 들어오면 학생 홈이다(기본도 사용자 앱)", () => {
      expect(homePathFor(committee(true), "user")).toBe("/main");
      expect(homePathFor(committee(true))).toBe("/main");
    });

    it("사용자 앱으로 들어왔고 동의하지 않았으면 동의 화면", () => {
      expect(homePathFor(committee(false), "user")).toBe("/consent");
    });
  });

  it("관리자 앱으로 들어온 학생 계정은 학생 홈(관리자 화면은 권한 안내가 막는다)", () => {
    expect(homePathFor(member({ consented: true }), "admin")).toBe("/main");
  });
});
