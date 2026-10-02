import { act, renderHook } from "@testing-library/react";
import { MOCK_VOLUNTEER_ROSTER } from "./mock-volunteer-roster";
import {
  getRoster,
  resetRoster,
  setRoster,
  useVolunteerRoster,
} from "./volunteer-roster-store";

afterEach(() => resetRoster());

describe("volunteer roster store", () => {
  it("처음에는 목업 명단이다", () => {
    expect(getRoster()).toBe(MOCK_VOLUNTEER_ROSTER);
  });

  it("바꾼 명단을 같은 저장소를 쓰는 다른 화면도 본다", () => {
    const first = renderHook(() => useVolunteerRoster());
    const second = renderHook(() => useVolunteerRoster());
    const next = MOCK_VOLUNTEER_ROSTER.slice(0, 2);

    act(() => first.result.current[1](next));

    expect(first.result.current[0]).toBe(next);
    expect(second.result.current[0]).toBe(next);
  });

  it("화면이 사라져도 명단은 남아 다음 화면이 이어서 본다", () => {
    const first = renderHook(() => useVolunteerRoster());
    const next = MOCK_VOLUNTEER_ROSTER.slice(0, 3);
    act(() => first.result.current[1](next));
    first.unmount();

    const later = renderHook(() => useVolunteerRoster());

    expect(later.result.current[0]).toBe(next);
  });

  it("resetRoster는 목업 처음 상태로 되돌린다", () => {
    act(() => setRoster([]));

    act(() => resetRoster());

    expect(getRoster()).toBe(MOCK_VOLUNTEER_ROSTER);
  });
});
