import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MOCK_VOLUNTEER_ROSTER } from "./mock-volunteer-roster";
import { createMockVolunteerGateway } from "./volunteer-mock-gateway";
import { AdminUnauthorizedError } from "./qr-api";
import {
  VolunteerGatewayProvider,
  type VolunteerGateway,
} from "./volunteer-gateway";
import {
  getRoster,
  resetRoster,
  setRoster,
  useVolunteerRoster,
} from "./volunteer-roster-store";

const redirectToAdminLogin = vi.hoisted(() => vi.fn());
vi.mock("@/lib/admin/admin-session", () => ({ redirectToAdminLogin }));

afterEach(() => {
  // 마운트된 훅이 비워진 저장소를 보고 다시 불러오지 않게 먼저 내린다.
  cleanup();
  resetRoster();
  redirectToAdminLogin.mockReset();
});

function wrapperFor(gateway: VolunteerGateway) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <VolunteerGatewayProvider value={gateway}>
        {children}
      </VolunteerGatewayProvider>
    );
  };
}

describe("volunteer roster store", () => {
  it("처음에는 비어 있고 쓰는 화면이 서버에서 한 번 받아 온다", async () => {
    const list = vi.fn().mockResolvedValue(MOCK_VOLUNTEER_ROSTER);

    const { result } = renderHook(() => useVolunteerRoster(), {
      wrapper: wrapperFor({ ...createMockVolunteerGateway(), list }),
    });

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.roster).toBe(MOCK_VOLUNTEER_ROSTER);
    expect(list).toHaveBeenCalledTimes(1);
  });

  it("두 화면이 같은 명단을 쓰고 서버 요청은 한 번이다", async () => {
    const list = vi.fn().mockResolvedValue(MOCK_VOLUNTEER_ROSTER);
    const wrapper = wrapperFor({ ...createMockVolunteerGateway(), list });

    const first = renderHook(() => useVolunteerRoster(), { wrapper });
    const second = renderHook(() => useVolunteerRoster(), { wrapper });

    await waitFor(() => expect(first.result.current.status).toBe("ready"));
    expect(second.result.current.roster).toBe(MOCK_VOLUNTEER_ROSTER);
    expect(list).toHaveBeenCalledTimes(1);
  });

  it("이미 받은 명단은 다시 받지 않고, 한 화면이 바꾼 학생을 다른 화면도 본다", () => {
    const list = vi.fn();
    const wrapper = wrapperFor({ ...createMockVolunteerGateway(), list });
    const changed = { ...MOCK_VOLUNTEER_ROSTER[0], count: 9 };
    act(() => setRoster(MOCK_VOLUNTEER_ROSTER));
    const first = renderHook(() => useVolunteerRoster(), { wrapper });
    const second = renderHook(() => useVolunteerRoster(), { wrapper });

    act(() => first.result.current.updateStudent(changed));
    first.unmount();

    expect(second.result.current.roster[0]).toBe(changed);
    expect(list).not.toHaveBeenCalled();
  });

  it("조회에 실패하면 error이고 reload로 다시 받는다", async () => {
    const list = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(MOCK_VOLUNTEER_ROSTER);

    const { result } = renderHook(() => useVolunteerRoster(), {
      wrapper: wrapperFor({ ...createMockVolunteerGateway(), list }),
    });
    await waitFor(() => expect(result.current.status).toBe("error"));

    act(() => result.current.reload());

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.roster).toBe(MOCK_VOLUNTEER_ROSTER);
  });

  it("401이면 관리자 로그인으로 보낸다", async () => {
    const list = vi.fn().mockRejectedValue(new AdminUnauthorizedError());

    renderHook(() => useVolunteerRoster(), {
      wrapper: wrapperFor({ ...createMockVolunteerGateway(), list }),
    });

    await waitFor(() => expect(redirectToAdminLogin).toHaveBeenCalledTimes(1));
  });

  it("resetRoster는 비어 있는 처음 상태로 되돌린다", () => {
    act(() => setRoster(MOCK_VOLUNTEER_ROSTER));

    act(() => resetRoster());

    expect(getRoster()).toEqual([]);
  });
});
