import { render, waitFor } from "@testing-library/react";
import RootPage from "./page";

function mockMe(status: number, body?: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(body === undefined ? null : JSON.stringify(body), {
        status,
      }),
    ),
  );
}

const replace = vi.fn();

beforeEach(() => {
  vi.stubGlobal("location", { ...window.location, replace });
});

afterEach(() => {
  replace.mockReset();
  vi.unstubAllGlobals();
});

describe("RootPage", () => {
  it.each([
    [
      "동의한 학생",
      { name: "홍길동", role: "STUDENT", consented: true },
      "/main",
    ],
    [
      "동의 안 한 학생",
      { name: "홍길동", role: "STUDENT", consented: false },
      "/consent",
    ],
    ["관리자", { name: "사감", role: "ADMIN", consented: false }, "/admin"],
  ])("로그인한 %s는 첫 화면으로 간다", async (_name, me, path) => {
    mockMe(200, me);
    render(<RootPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith(path));
  });

  it("로그인하지 않았으면 로그인 화면으로 간다", async () => {
    mockMe(401);
    render(<RootPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("확인이 실패하면 로그인 화면으로 간다", async () => {
    mockMe(500);
    render(<RootPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });
});
