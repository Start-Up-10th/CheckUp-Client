import { fetchCurrentMember, logout } from "./auth-api";

function mockFetch(status: number, body?: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchCurrentMember", () => {
  it("세션 쿠키와 함께 /api/v1/auth/me를 부른다", async () => {
    const fetchMock = mockFetch(200, { name: "김도현", role: "STUDENT" });

    await fetchCurrentMember();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/auth/me");
    expect(init.credentials).toBe("include");
  });

  it.each(["STUDENT", "ADMIN"] as const)("%s 회원을 돌려준다", async (role) => {
    mockFetch(200, { name: "김도현", role, consented: true });

    await expect(fetchCurrentMember()).resolves.toEqual({
      name: "김도현",
      role,
      consented: true,
      student: null,
    });
  });

  it("학생 정보를 함께 돌려준다", async () => {
    const student = {
      studentId: 1234,
      grade: 2,
      classNumber: 4,
      number: 5,
      studentNumber: 2405,
      dormitoryRoom: 412,
      dormitoryFloor: 4,
    };
    mockFetch(200, {
      name: "김도현",
      role: "STUDENT",
      consented: true,
      student,
    });

    await expect(fetchCurrentMember()).resolves.toMatchObject({ student });
  });

  it("호실이 배정되지 않은 학생은 호실·층이 null", async () => {
    mockFetch(200, {
      name: "김도현",
      role: "STUDENT",
      student: {
        studentId: 1234,
        grade: 1,
        classNumber: 1,
        number: 1,
        studentNumber: 1101,
        dormitoryRoom: null,
        dormitoryFloor: null,
      },
    });

    await expect(fetchCurrentMember()).resolves.toMatchObject({
      student: { dormitoryRoom: null, dormitoryFloor: null },
    });
  });

  it("학생 정보가 null이면(교사) null", async () => {
    mockFetch(200, { name: "교사", role: "ADMIN", student: null });

    await expect(fetchCurrentMember()).resolves.toMatchObject({
      student: null,
    });
  });

  it("학생 정보가 계약과 다르면 오류", async () => {
    mockFetch(200, {
      name: "김도현",
      role: "STUDENT",
      student: { studentNumber: "2405" },
    });

    await expect(fetchCurrentMember()).rejects.toThrow("unexpected response");
  });

  it("동의 여부가 없거나 true가 아니면 false로 본다", async () => {
    mockFetch(200, { name: "김도현", role: "STUDENT" });

    await expect(fetchCurrentMember()).resolves.toMatchObject({
      consented: false,
    });
  });

  it("로그인하지 않았으면(401) null", async () => {
    mockFetch(401);

    await expect(fetchCurrentMember()).resolves.toBeNull();
  });

  it("서버 오류는 오류로 올린다", async () => {
    mockFetch(500);

    await expect(fetchCurrentMember()).rejects.toThrow("authMe: 500");
  });

  it("계약에 없는 역할이면 오류", async () => {
    mockFetch(200, { name: "김도현", role: "TEACHER" });

    await expect(fetchCurrentMember()).rejects.toThrow("unexpected response");
  });
});

describe("logout", () => {
  it("세션 쿠키와 함께 POST /api/v1/auth/logout을 부른다", async () => {
    const fetchMock = mockFetch(204);

    await logout();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/auth/logout");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
  });

  it("서버 오류는 오류로 올린다", async () => {
    mockFetch(500);

    await expect(logout()).rejects.toThrow("authLogout: 500");
  });
});
