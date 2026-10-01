import { renderHook, waitFor } from "@testing-library/react";
import { useAdminLogout } from "./use-admin-logout";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

afterEach(() => {
  replace.mockReset();
  vi.unstubAllGlobals();
});

describe("useAdminLogout", () => {
  it("서버 세션을 끊고 관리자 로그인으로 간다", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() => useAdminLogout());

    result.current();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/login"));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/auth/logout");
    expect(init.method).toBe("POST");
  });

  it("서버 요청이 실패해도 로그인 화면으로 간다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    const { result } = renderHook(() => useAdminLogout());

    result.current();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/login"));
  });
});
