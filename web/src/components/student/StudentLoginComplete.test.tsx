import { render, waitFor } from "@testing-library/react";
import { rememberLoginApp, takeLoginApp } from "@/lib/auth/login-app";
import { QR_RETURN_URL_KEY } from "@/lib/student/qr-return-url";
import { StudentLoginComplete } from "./StudentLoginComplete";

/** 기숙사 자치위원처럼 학생 정보가 있는 관리자. */
const COMMITTEE = {
  name: "자치위원",
  role: "ADMIN",
  consented: true,
  student: {
    studentId: 17,
    grade: 2,
    classNumber: 4,
    number: 5,
    studentNumber: 2405,
    dormitoryRoom: 412,
    dormitoryFloor: 4,
  },
};

const QR_URL = `/qr#t=${"a".repeat(43)}`;
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
  window.sessionStorage.clear();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe("StudentLoginComplete", () => {
  it("로그인이 안 됐으면 로그인 실패 화면으로", async () => {
    mockMe(401);
    render(<StudentLoginComplete />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login?error=1"));
  });

  it("서버 오류도 로그인 실패 화면으로", async () => {
    mockMe(500);
    render(<StudentLoginComplete />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login?error=1"));
  });

  it("관리자 로그인에서 시작한 관리자는 관리자 홈으로", async () => {
    rememberLoginApp("admin");
    mockMe(200, { name: "사감", role: "ADMIN" });
    render(<StudentLoginComplete />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin"));
  });

  it("어느 로그인인지 알 수 없는 관리자도 쫓아내지 않고 관리자 홈으로", async () => {
    mockMe(200, { name: "사감", role: "ADMIN" });
    render(<StudentLoginComplete />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin"));
  });

  it("관리자 로그인에서 시작한 기숙사 자치위원도 관리자 홈으로", async () => {
    rememberLoginApp("admin");
    mockMe(200, COMMITTEE);
    render(<StudentLoginComplete />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin"));
  });

  it("사용자 로그인으로 들어온 관리자 권한 계정은 로그아웃하고 안내로 보낸다(기숙사 자치위원 포함)", async () => {
    rememberLoginApp("user");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(COMMITTEE), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<StudentLoginComplete />);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/login?error=ADMIN_ACCOUNT"),
    );
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/v1/auth/logout",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("로그아웃이 실패해도 안내로 보낸다", async () => {
    rememberLoginApp("user");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify(COMMITTEE), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        )
        .mockRejectedValueOnce(new Error("network")),
    );
    render(<StudentLoginComplete />);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/login?error=ADMIN_ACCOUNT"),
    );
  });

  it("시작한 로그인 기록은 한 번 읽고 지운다", async () => {
    rememberLoginApp("admin");
    mockMe(200, COMMITTEE);
    render(<StudentLoginComplete />);
    await waitFor(() => expect(replace).toHaveBeenCalled());
    expect(takeLoginApp()).toBeNull();
  });

  it("QR 링크로 왔던 학생은 저장한 QR 주소로 돌아가고 값은 지운다", async () => {
    window.sessionStorage.setItem(QR_RETURN_URL_KEY, QR_URL);
    mockMe(200, { name: "김도현", role: "STUDENT" });
    render(<StudentLoginComplete />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith(QR_URL));
    expect(window.sessionStorage.getItem(QR_RETURN_URL_KEY)).toBeNull();
  });

  it("QR 링크로 왔더라도 관리자(로그인 시작을 알 수 없음)는 관리자 홈으로 간다(관리자는 QR 출석을 하지 않는다)", async () => {
    window.sessionStorage.setItem(QR_RETURN_URL_KEY, QR_URL);
    mockMe(200, { name: "사감", role: "ADMIN" });
    render(<StudentLoginComplete />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin"));
  });

  it("아직 동의하지 않은 학생은 개인정보 동의로", async () => {
    mockMe(200, { name: "김도현", role: "STUDENT", consented: false });
    render(<StudentLoginComplete />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/consent"));
  });

  it("이미 동의한 학생은 학생 홈으로", async () => {
    mockMe(200, { name: "김도현", role: "STUDENT", consented: true });
    render(<StudentLoginComplete />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/main"));
  });

  it("로그인이 안 됐으면 저장한 QR 주소를 남겨 둔다(다시 로그인할 때 쓴다)", async () => {
    window.sessionStorage.setItem(QR_RETURN_URL_KEY, QR_URL);
    mockMe(401);
    render(<StudentLoginComplete />);
    await waitFor(() => expect(replace).toHaveBeenCalled());
    expect(window.sessionStorage.getItem(QR_RETURN_URL_KEY)).toBe(QR_URL);
  });
});
