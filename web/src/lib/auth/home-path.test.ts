import type { CurrentMember } from "./auth-api";
import { homePathFor } from "./home-path";

const member = (overrides: Partial<CurrentMember>): CurrentMember => ({
  name: "홍길동",
  role: "STUDENT",
  consented: true,
  student: null,
  ...overrides,
});

/** 기숙사 자치위원처럼 학생 정보가 있는 관리자. */
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
  it("관리자 권한 계정은 항상 관리자 홈(학생 정보 유무와 상관없다)", () => {
    expect(homePathFor(member({ role: "ADMIN", consented: false }))).toBe(
      "/admin",
    );
    expect(
      homePathFor(
        member({ role: "ADMIN", consented: true, student: STUDENT_INFO }),
      ),
    ).toBe("/admin");
  });

  it("동의한 학생은 학생 홈", () => {
    expect(homePathFor(member({ consented: true }))).toBe("/main");
  });

  it("동의하지 않은 학생은 동의 화면", () => {
    expect(homePathFor(member({ consented: false }))).toBe("/consent");
  });
});
