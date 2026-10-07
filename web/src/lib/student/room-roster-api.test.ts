import { RateLimitedError } from "@/lib/rate-limit";
import {
  RoomLoginRequiredError,
  fetchMyRoomMates,
  sortRoomMates,
} from "./room-roster-api";

function mockFetch(status: number, body?: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchMyRoomMates", () => {
  it("본인 호실과 기숙사 입소 용도로 세션 쿠키와 함께 조회한다", async () => {
    const fetchMock = mockFetch(200, []);

    await fetchMyRoomMates("412");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "/api/v1/room/student?dormitoryRoom=412&purpose=DORMITORY",
    );
    expect(init.credentials).toBe("include");
  });

  it("학번·이름·출석 여부를 이름순으로 돌려준다", async () => {
    mockFetch(200, [
      {
        student_name: "정민수",
        student_class: 4,
        student_number: 2421,
        attended: false,
      },
      {
        student_name: "김도현",
        student_class: 4,
        student_number: 2405,
        attended: true,
      },
    ]);

    await expect(fetchMyRoomMates("412")).resolves.toEqual([
      { id: "2405", name: "김도현", present: true },
      { id: "2421", name: "정민수", present: false },
    ]);
  });

  it("출석 여부가 없거나 true가 아니면 미출석으로 본다", async () => {
    mockFetch(200, [
      { student_name: "김도현", student_class: 4, student_number: 2405 },
    ]);

    await expect(fetchMyRoomMates("412")).resolves.toEqual([
      { id: "2405", name: "김도현", present: false },
    ]);
  });

  it("로그인하지 않았으면(401) 로그인 필요 오류", async () => {
    mockFetch(401);

    await expect(fetchMyRoomMates("412")).rejects.toBeInstanceOf(
      RoomLoginRequiredError,
    );
  });

  it.each([403, 500])("%i는 일반 오류", async (status) => {
    mockFetch(status);

    await expect(fetchMyRoomMates("412")).rejects.toThrow(
      `roomRoster: ${status}`,
    );
  });

  it.each([
    ["배열이 아님", { students: [] }],
    ["이름 없음", [{ student_number: 2405, attended: true }]],
  ])("응답이 계약과 다르면 오류(%s)", async (_name, body) => {
    mockFetch(200, body);

    await expect(fetchMyRoomMates("412")).rejects.toThrow(
      "roomRoster: unexpected response",
    );
  });
});

describe("sortRoomMates", () => {
  it("이름순, 같은 이름이면 학번순", () => {
    expect(
      sortRoomMates([
        { id: "2412", name: "박서연", present: true },
        { id: "2405", name: "김도현", present: true },
        { id: "2401", name: "김도현", present: false },
      ]).map((m) => m.id),
    ).toEqual(["2401", "2405", "2412"]);
  });
});

describe("429 응답", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("429면 Retry-After를 담은 RateLimitedError다", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation(
          async () =>
            new Response(null, {
              status: 429,
              headers: { "Retry-After": "3" },
            }),
        ),
    );

    const error = await fetchMyRoomMates("412").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(RateLimitedError);
    expect((error as RateLimitedError).retryAfterMs).toBe(3000);
  });
});
