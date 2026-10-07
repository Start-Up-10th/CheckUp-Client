import { render, waitFor } from "@testing-library/react";
import { RootRedirect } from "./RootRedirect";

const originalLocation = window.location;
let replace: ReturnType<typeof vi.fn>;

function mockMe(status: number, body?: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(body === undefined ? null : JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
}

const STUDENT_INFO = {
  studentId: 17,
  grade: 2,
  classNumber: 4,
  number: 5,
  studentNumber: 2405,
  dormitoryRoom: 412,
  dormitoryFloor: 4,
};

beforeEach(() => {
  replace = vi.fn();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { origin: "http://localhost:3000", replace },
  });
});

afterEach(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation,
  });
  vi.unstubAllGlobals();
});

describe("RootRedirect(사용자 앱 첫 화면)", () => {
  it("로그인하지 않았으면 로그인 화면으로", async () => {
    mockMe(401);
    render(<RootRedirect />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("동의한 학생은 학생 홈으로", async () => {
    mockMe(200, { name: "김도현", role: "STUDENT", consented: true });
    render(<RootRedirect />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/main"));
  });

  it("기숙사 자치위원(학생 정보가 있는 관리자)도 사용자 앱으로 들어오면 학생 홈으로", async () => {
    mockMe(200, {
      name: "자치위원",
      role: "ADMIN",
      consented: true,
      student: STUDENT_INFO,
    });
    render(<RootRedirect />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/main"));
  });

  it("학생 정보가 없는 관리자(사감 등)는 관리자 홈으로", async () => {
    mockMe(200, { name: "사감", role: "ADMIN", consented: true });
    render(<RootRedirect />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin"));
  });
});
