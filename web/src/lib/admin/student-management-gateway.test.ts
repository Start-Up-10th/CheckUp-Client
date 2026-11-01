import { afterEach, describe, expect, it, vi } from "vitest";
import {
  apiStudentManagementGateway,
  PartialSaveError,
} from "./student-management-gateway";
import type { RosterStudent } from "./volunteer-types";

const STUDENT: RosterStudent = {
  id: 17,
  studentId: "2405",
  name: "김도현",
  roomNumber: 412,
  count: 3,
  duty: "none",
  consecutiveCount: 0,
};

/**
 * 서버 흉내: 지금 횟수를 들고 있다가 PATCH의 delta를 더한다. `failConsecutive`면 연속 조정만 500으로 실패한다.
 */
function stubServer(
  server = { count: 3, consecutive: 0 },
  options: { failConsecutive?: boolean } = {},
) {
  const fetchMock = vi
    .fn()
    .mockImplementation(async (url: string, init: RequestInit) => {
      const delta = JSON.parse(init.body as string).delta as number;
      if (url.endsWith("/consecutive/count")) {
        if (options.failConsecutive) return new Response(null, { status: 500 });
        server.consecutive += delta;
      } else {
        server.count += delta;
      }
      return new Response(
        JSON.stringify({
          studentId: 17,
          name: "김도현",
          studentNumber: 2405,
          dormitoryRoom: 412,
          volunteerCount: server.count,
          consecutiveVolunteerCount: server.consecutive,
        }),
        { status: 200 },
      );
    });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** 요청을 `[경로, 본문]`으로 모은다. */
function patches(fetchMock: ReturnType<typeof stubServer>) {
  return fetchMock.mock.calls.map(([url, init]) => [
    url,
    JSON.parse(init.body),
  ]);
}

afterEach(() => vi.unstubAllGlobals());

describe("apiStudentManagementGateway", () => {
  it("다이얼로그를 연 때에서 바꾼 만큼을 사유와 함께 보낸다", async () => {
    const fetchMock = stubServer();

    const updated = await apiStudentManagementGateway.saveCount(STUDENT, {
      count: 5,
      reason: "청소 당번 대체",
    });

    expect(patches(fetchMock)).toEqual([
      ["/api/v1/volunteer/17/count", { delta: 2, reason: "청소 당번 대체" }],
    ]);
    expect(updated.count).toBe(5);
  });

  it("줄이는 변화는 음수로 보낸다", async () => {
    const fetchMock = stubServer();

    await apiStudentManagementGateway.saveCount(STUDENT, {
      count: 1,
      reason: "",
    });

    expect(patches(fetchMock)).toEqual([
      ["/api/v1/volunteer/17/count", { delta: -2 }],
    ]);
  });

  it("변화가 서버 한도(99)를 넘으면 나눠 차례로 보낸다", async () => {
    const fetchMock = stubServer();

    await apiStudentManagementGateway.saveCount(STUDENT, {
      count: 3 + 150,
      reason: "",
    });

    expect(patches(fetchMock).map(([, body]) => body.delta)).toEqual([99, 51]);
  });

  it("연속 봉사 변화는 일반 횟수와 따로 consecutive 경로로 보낸다", async () => {
    const fetchMock = stubServer({ count: 3, consecutive: 1 });

    const updated = await apiStudentManagementGateway.saveCount(
      { ...STUDENT, consecutiveCount: 1 },
      { consecutiveCount: 6, reason: "" },
    );

    expect(patches(fetchMock)).toEqual([
      ["/api/v1/volunteer/17/consecutive/count", { delta: 5 }],
    ]);
    expect(updated.consecutiveCount).toBe(6);
  });

  it("그사이 다른 곳에서 완료해도 그 변경을 지우지 않고 바꾼 만큼만 더한다", async () => {
    // 다이얼로그는 연속 3회로 열렸고, 그사이 완료돼 서버는 2회다. 관리자는 +2(5회)를 정했다.
    const server = { count: 3, consecutive: 2 };
    stubServer(server);

    await apiStudentManagementGateway.saveCount(
      { ...STUDENT, consecutiveCount: 3 },
      { consecutiveCount: 5, reason: "" },
    );

    expect(server.consecutive).toBe(4);
  });

  it("넘기지 않은 칸은 보내지 않는다", async () => {
    const server = { count: 3, consecutive: 2 };
    const fetchMock = stubServer(server);

    await apiStudentManagementGateway.saveCount(
      { ...STUDENT, consecutiveCount: 3 },
      { count: 4, reason: "" },
    );

    expect(patches(fetchMock)).toEqual([
      ["/api/v1/volunteer/17/count", { delta: 1 }],
    ]);
    expect(server).toEqual({ count: 4, consecutive: 2 });
  });

  it("일반만 반영되고 연속이 실패하면 반영된 값을 담아 알리고, 그 값으로 다시 저장하면 연속만 보낸다", async () => {
    const server = { count: 3, consecutive: 0 };
    stubServer(server, { failConsecutive: true });

    const error = await apiStudentManagementGateway
      .saveCount(STUDENT, { count: 5, consecutiveCount: 2, reason: "" })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(PartialSaveError);
    const partial = error as PartialSaveError;
    expect(partial.failed).toBe("consecutive");
    expect(partial.saved.count).toBe(5);
    expect(partial.saved.consecutiveCount).toBe(0);
    expect(partial.latest.count).toBe(5);

    // 화면은 `saved`를 기준으로 삼아, 일반 횟수는 바뀌지 않은 칸이 되어 연속만 다시 보낸다.
    const fetchMock = stubServer(server);
    await apiStudentManagementGateway.saveCount(partial.saved, {
      consecutiveCount: 2,
      reason: "",
    });

    expect(patches(fetchMock)).toEqual([
      ["/api/v1/volunteer/17/consecutive/count", { delta: 2 }],
    ]);
    expect(server).toEqual({ count: 5, consecutive: 2 });
  });

  it("아무것도 반영되지 않고 실패하면 원래 오류를 그대로 던진다", async () => {
    stubServer(undefined, { failConsecutive: true });

    const error = await apiStudentManagementGateway
      .saveCount(STUDENT, { consecutiveCount: 2, reason: "" })
      .catch((caught: unknown) => caught);

    expect(error).not.toBeInstanceOf(PartialSaveError);
  });
});
