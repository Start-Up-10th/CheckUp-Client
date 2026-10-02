import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MOCK_VOLUNTEER_ROSTER } from "./mock-volunteer-roster";
import {
  VolunteerGatewayProvider,
  type VolunteerGateway,
} from "./volunteer-gateway";
import { createMockVolunteerGateway } from "./volunteer-mock-gateway";
import {
  getRoster,
  resetRoster,
  setRoster,
  useVolunteerRoster,
} from "./volunteer-roster-store";

vi.mock("@/lib/admin/admin-session", () => ({
  redirectToAdminLogin: vi.fn(),
}));

afterEach(() => {
  cleanup();
  resetRoster();
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

describe("조용한 새로고침과 동작 반영", () => {
  it("이미 보이는 명단을 다시 받다가 실패해도 명단과 ready를 그대로 둔다", async () => {
    const list = vi.fn().mockRejectedValue(new Error("network"));
    act(() => setRoster(MOCK_VOLUNTEER_ROSTER));
    const { result } = renderHook(() => useVolunteerRoster(), {
      wrapper: wrapperFor({ ...createMockVolunteerGateway(), list }),
    });

    act(() => result.current.reload());

    await waitFor(() => expect(list).toHaveBeenCalledTimes(1));
    expect(result.current.status).toBe("ready");
    expect(result.current.roster).toBe(MOCK_VOLUNTEER_ROSTER);
  });

  it("새로고침 중에 동작이 끝나도 응답은 반영하되 그 학생은 동작 결과를 유지한다", async () => {
    let finishReload: (
      students: typeof MOCK_VOLUNTEER_ROSTER,
    ) => void = () => {};
    const list = vi.fn().mockReturnValue(
      new Promise<typeof MOCK_VOLUNTEER_ROSTER>((resolve) => {
        finishReload = resolve;
      }),
    );
    act(() => setRoster(MOCK_VOLUNTEER_ROSTER));
    const { result } = renderHook(() => useVolunteerRoster(), {
      wrapper: wrapperFor({ ...createMockVolunteerGateway(), list }),
    });
    act(() => result.current.reload());
    const changed = { ...MOCK_VOLUNTEER_ROSTER[0], count: 9 };
    act(() => result.current.updateStudent(changed));

    // 응답은 동작보다 먼저 서버를 읽은 낡은 값이다: 0번 학생은 옛 횟수, 1번 학생은 새 값.
    const stale = [
      MOCK_VOLUNTEER_ROSTER[0],
      { ...MOCK_VOLUNTEER_ROSTER[1], count: 5 },
    ];
    await act(async () => finishReload(stale));

    expect(getRoster()).toHaveLength(2);
    expect(getRoster()[0]).toBe(changed);
    expect(getRoster()[1].count).toBe(5);
  });

  it("새로고침이 끝난 뒤의 동작 결과는 다음 새로고침에 영향을 주지 않는다", async () => {
    const list = vi.fn().mockResolvedValue(MOCK_VOLUNTEER_ROSTER);
    act(() => setRoster(MOCK_VOLUNTEER_ROSTER));
    const { result } = renderHook(() => useVolunteerRoster(), {
      wrapper: wrapperFor({ ...createMockVolunteerGateway(), list }),
    });
    act(() => result.current.reload());
    await waitFor(() => expect(list).toHaveBeenCalledTimes(1));
    act(() =>
      result.current.updateStudent({ ...MOCK_VOLUNTEER_ROSTER[0], count: 9 }),
    );

    act(() => result.current.reload());
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));

    await waitFor(() =>
      expect(getRoster()[0].count).toBe(MOCK_VOLUNTEER_ROSTER[0].count),
    );
  });

  it("updateStudent는 그 학생만 바꾸고 나머지는 그대로 둔다", () => {
    act(() => setRoster(MOCK_VOLUNTEER_ROSTER));
    const { result } = renderHook(() => useVolunteerRoster(), {
      wrapper: wrapperFor(createMockVolunteerGateway()),
    });
    const target = MOCK_VOLUNTEER_ROSTER[0];

    act(() => result.current.updateStudent({ ...target, count: 9 }));

    expect(getRoster()[0].count).toBe(9);
    expect(getRoster().slice(1)).toEqual(MOCK_VOLUNTEER_ROSTER.slice(1));
  });
});
