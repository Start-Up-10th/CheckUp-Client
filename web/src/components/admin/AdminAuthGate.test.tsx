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

describe("AdminAuthGate 개발 미리보기", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function loadGate() {
    vi.resetModules();
    return (await import("./AdminAuthGate")).AdminAuthGate;
  }

  it("개발 모드에서 미리보기를 켜면 서버 확인 없이 화면을 보여 준다", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_ADMIN_PREVIEW", "true");
    const fetchMock = mockMe(401);
    const Gate = await loadGate();

    render(
      <Gate>
        <p>관리자 화면</p>
      </Gate>,
    );

    expect(screen.getByText("관리자 화면")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("개발 모드가 아니면 값이 있어도 로그인 확인을 한다", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_ADMIN_PREVIEW", "true");
    const fetchMock = mockMe(401);
    const Gate = await loadGate();

    render(
      <Gate>
        <p>관리자 화면</p>
      </Gate>,
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/login"));
    expect(fetchMock).toHaveBeenCalled();
    expect(screen.queryByText("관리자 화면")).not.toBeInTheDocument();
  });

  it("미리보기를 켜지 않으면 개발 모드에서도 로그인 확인을 한다", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const fetchMock = mockMe(401);
    const Gate = await loadGate();

    render(
      <Gate>
        <p>관리자 화면</p>
      </Gate>,
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/login"));
    expect(fetchMock).toHaveBeenCalled();
  });
});
