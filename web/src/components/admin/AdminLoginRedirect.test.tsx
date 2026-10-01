import { render, waitFor } from "@testing-library/react";
import { AdminLoginRedirect } from "./AdminLoginRedirect";

const replace = vi.fn();
// 실제 useRouter처럼 렌더마다 같은 객체를 돌려준다.
const router = { replace };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

function mockMe(status: number, body?: unknown) {
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
  replace.mockReset();
  vi.unstubAllGlobals();
});

describe("AdminLoginRedirect", () => {
  it("이미 관리자로 로그인했으면 관리자 홈으로 보낸다", async () => {
    mockMe(200, { name: "김관리", role: "ADMIN" });

    render(<AdminLoginRedirect />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin"));
  });

  it("로그인하지 않았으면 그대로 둔다", async () => {
    const fetchMock = mockMe(401);

    render(<AdminLoginRedirect />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await Promise.resolve();
    expect(replace).not.toHaveBeenCalled();
  });

  it("학생 계정이면 그대로 둔다", async () => {
    const fetchMock = mockMe(200, { name: "김학생", role: "STUDENT" });

    render(<AdminLoginRedirect />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await Promise.resolve();
    expect(replace).not.toHaveBeenCalled();
  });

  it("확인에 실패해도 오류 없이 그대로 둔다", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network"));
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminLoginRedirect />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await Promise.resolve();
    expect(replace).not.toHaveBeenCalled();
  });
});
