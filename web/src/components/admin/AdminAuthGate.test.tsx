import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AdminAuthGate } from "./AdminAuthGate";

const replace = vi.fn();
// 실제 useRouter처럼 렌더마다 같은 객체를 돌려준다(새 객체면 effect가 다시 돈다).
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

function renderGate() {
  return render(
    <AdminAuthGate>
      <p>관리자 화면</p>
    </AdminAuthGate>,
  );
}

afterEach(() => {
  replace.mockReset();
  vi.unstubAllGlobals();
});

describe("AdminAuthGate", () => {
  it("확인하는 동안에는 관리자 화면을 그리지 않는다", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {})),
    );

    renderGate();

    expect(screen.queryByText("관리자 화면")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("확인하는 동안의 빈 화면은 100vh가 아니라 보이는 영역 높이(h-dvh)를 쓴다", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>(() => {})),
    );

    const { container } = renderGate();

    // 모바일 브라우저에서 100vh는 주소창·툴바 뒤까지 커서 화면 아래가 잘린다.
    expect(container.querySelector("[aria-busy='true']")).toHaveClass("h-dvh");
    expect(container.querySelector(".h-screen")).toBeNull();
  });

  it("관리자 세션이면 화면을 보여 준다", async () => {
    const fetchMock = mockMe(200, { name: "김관리", role: "ADMIN" });

    renderGate();

    expect(await screen.findByText("관리자 화면")).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/auth/me");
    expect(replace).not.toHaveBeenCalled();
  });

  it("로그인하지 않았으면 관리자 로그인으로 보낸다", async () => {
    mockMe(401);

    renderGate();

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/login"));
    expect(screen.queryByText("관리자 화면")).not.toBeInTheDocument();
  });

  it("학생 계정이면 권한 없음 화면으로 보낸다", async () => {
    mockMe(200, { name: "김학생", role: "STUDENT" });

    renderGate();

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/admin/unauthorized"),
    );
    expect(screen.queryByText("관리자 화면")).not.toBeInTheDocument();
  });

  it("서버 오류면 오류 상태를 보여 주고 다시 시도하면 확인한다", async () => {
    const fetchMock = mockMe(500);

    renderGate();

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("관리자 화면")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ name: "김관리", role: "ADMIN" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByText("관리자 화면")).toBeInTheDocument();
  });
});
