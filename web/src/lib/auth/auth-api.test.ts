import { fetchCurrentMember } from "./auth-api";

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
    mockFetch(200, { name: "김도현", role });

    await expect(fetchCurrentMember()).resolves.toEqual({
      name: "김도현",
      role,
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
