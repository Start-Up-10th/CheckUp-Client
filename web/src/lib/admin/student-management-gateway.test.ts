import { afterEach, describe, expect, it, vi } from "vitest";
import { apiStudentManagementGateway } from "./student-management-gateway";
import type { RosterStudent } from "./volunteer-types";

const STUDENT: RosterStudent = {
  id: 17,
  studentId: "2405",
  name: "김도현",
  roomNumber: 412,
  count: 3,
  duty: "none",
};

function stubFetch() {
  const fetchMock = vi.fn().mockImplementation(
    async (_url: string, init: RequestInit) =>
      new Response(
        JSON.stringify({
          studentId: 17,
          name: "김도현",
          studentNumber: 2405,
          dormitoryRoom: 412,
          volunteerCount: 3 + JSON.parse(init.body as string).delta,
        }),
        { status: 200 },
      ),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("apiStudentManagementGateway", () => {
  it("화면의 횟수와 지금 횟수의 차이를 사유와 함께 보낸다", async () => {
    const fetchMock = stubFetch();

    const updated = await apiStudentManagementGateway.saveCount(STUDENT, {
      count: 5,
      reason: "청소 당번 대체",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      delta: 2,
      reason: "청소 당번 대체",
    });
    expect(updated.count).toBe(5);
  });

  it("줄이는 변화는 음수로 보낸다", async () => {
    const fetchMock = stubFetch();

    await apiStudentManagementGateway.saveCount(STUDENT, {
      count: 1,
      reason: "",
    });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ delta: -2 });
  });

  it("변화가 서버 한도(99)를 넘으면 나눠 차례로 보낸다", async () => {
    const fetchMock = stubFetch();

    await apiStudentManagementGateway.saveCount(STUDENT, {
      count: 3 + 150,
      reason: "",
    });

    expect(
      fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body).delta),
    ).toEqual([99, 51]);
  });
});
