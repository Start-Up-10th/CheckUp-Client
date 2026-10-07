import { RateLimitedError } from "@/lib/rate-limit";
import {
  NotificationLoginRequiredError,
  NotificationNotStudentError,
  fetchHasUnreadNotification,
  fetchNotifications,
  markNotificationsRead,
} from "./notification-api";

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

describe("fetchNotifications", () => {
  it("세션 쿠키와 함께 알림 목록을 조회한다(학생 ID는 보내지 않는다)", async () => {
    const fetchMock = mockFetch(200, { hasUnread: false, notifications: [] });

    await fetchNotifications();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/notifications");
    expect(init.credentials).toBe("include");
    expect(init.method).toBeUndefined();
  });

  it("서버 응답을 읽지 않음 여부와 알림 목록으로 돌려준다", async () => {
    mockFetch(200, {
      hasUnread: true,
      notifications: [
        {
          id: 2,
          type: "VOLUNTEER",
          message: "봉사 활동이 등록되었습니다",
          createdAt: "2026-10-02T06:40:00Z",
          read: false,
        },
        {
          id: 1,
          type: "ATTENDANCE",
          message: "출석이 완료되었습니다",
          createdAt: "2026-10-01T23:12:00Z",
          read: true,
        },
      ],
    });

    await expect(fetchNotifications()).resolves.toEqual({
      hasUnread: true,
      notifications: [
        {
          id: 2,
          message: "봉사 활동이 등록되었습니다",
          createdAt: "2026-10-02T06:40:00Z",
          read: false,
        },
        {
          id: 1,
          message: "출석이 완료되었습니다",
          createdAt: "2026-10-01T23:12:00Z",
          read: true,
        },
      ],
    });
  });

  it("알림이 없으면 빈 목록", async () => {
    mockFetch(200, { hasUnread: false, notifications: [] });

    await expect(fetchNotifications()).resolves.toEqual({
      hasUnread: false,
      notifications: [],
    });
  });

  it("로그인하지 않았으면(401) 로그인 필요 오류", async () => {
    mockFetch(401);

    await expect(fetchNotifications()).rejects.toBeInstanceOf(
      NotificationLoginRequiredError,
    );
  });

  it("학생이 아니면(403) 학생 아님 오류", async () => {
    mockFetch(403);

    await expect(fetchNotifications()).rejects.toBeInstanceOf(
      NotificationNotStudentError,
    );
  });

  it("500은 일반 오류", async () => {
    mockFetch(500);

    await expect(fetchNotifications()).rejects.toThrow("notifications: 500");
  });

  it.each([
    ["목록이 없음", { hasUnread: false }],
    [
      "알림에 문구가 없음",
      {
        hasUnread: false,
        notifications: [{ id: 1, createdAt: "2026-10-02T06:40:00Z" }],
      },
    ],
  ])("응답이 계약과 다르면 오류(%s)", async (_name, body) => {
    mockFetch(200, body);

    await expect(fetchNotifications()).rejects.toThrow(
      "notifications: unexpected response",
    );
  });
});

describe("fetchHasUnreadNotification", () => {
  it("세션 쿠키와 함께 읽지 않은 알림 여부를 조회한다", async () => {
    const fetchMock = mockFetch(200, { hasUnread: true });

    await expect(fetchHasUnreadNotification()).resolves.toBe(true);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/notifications/unread");
    expect(init.credentials).toBe("include");
  });

  it("값이 true가 아니면 없음으로 본다", async () => {
    mockFetch(200, {});

    await expect(fetchHasUnreadNotification()).resolves.toBe(false);
  });

  it("로그인하지 않았으면(401) 로그인 필요 오류", async () => {
    mockFetch(401);

    await expect(fetchHasUnreadNotification()).rejects.toBeInstanceOf(
      NotificationLoginRequiredError,
    );
  });
});

describe("markNotificationsRead", () => {
  it("세션 쿠키와 함께 POST로 전체 읽음을 보낸다", async () => {
    const fetchMock = mockFetch(204);

    await expect(markNotificationsRead()).resolves.toBeUndefined();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/notifications/read");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
  });

  it("로그인하지 않았으면(401) 로그인 필요 오류", async () => {
    mockFetch(401);

    await expect(markNotificationsRead()).rejects.toBeInstanceOf(
      NotificationLoginRequiredError,
    );
  });

  it("학생이 아니면(403) 학생 아님 오류", async () => {
    mockFetch(403);

    await expect(markNotificationsRead()).rejects.toBeInstanceOf(
      NotificationNotStudentError,
    );
  });

  it("500은 일반 오류", async () => {
    mockFetch(500);

    await expect(markNotificationsRead()).rejects.toThrow(
      "notificationsRead: 500",
    );
  });
});

describe("429 응답", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("429면 Retry-After를 담은 RateLimitedError다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        async () =>
          new Response(null, {
            status: 429,
            headers: { "Retry-After": "3" },
          }),
      ),
    );

    const error = await fetchNotifications().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(RateLimitedError);
    expect((error as RateLimitedError).retryAfterMs).toBe(3000);
  });
});
