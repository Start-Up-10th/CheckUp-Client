export type StudentNotification = {
  id: number;
  /** 화면에 그대로 보여 줄 문구. 서버가 만든다. */
  message: string;
  /** 알림을 만든 시각(ISO-8601 UTC). 상대 시각 문구는 웹이 이 값으로 계산한다. */
  createdAt: string;
  read: boolean;
};

export type NotificationList = {
  /** 읽지 않은 알림이 하나라도 있는지 */
  hasUnread: boolean;
  /** 최근 50개, 최신순 */
  notifications: StudentNotification[];
};

/** 로그인이 필요하다(401). */
export class NotificationLoginRequiredError extends Error {
  constructor() {
    super("login required");
  }
}

/** 학생 정보가 없는 계정이다(403 `MISSING_STUDENT_INFO`). 교사 계정 등 */
export class NotificationNotStudentError extends Error {
  constructor() {
    super("not a student");
  }
}

function assertOk(res: Response, name: string) {
  if (res.status === 401) throw new NotificationLoginRequiredError();
  if (res.status === 403) throw new NotificationNotStudentError();
  if (!res.ok) throw new Error(`${name}: ${res.status}`);
}

function toNotification(item: unknown): StudentNotification {
  const { id, message, createdAt, read } = (item ?? {}) as Record<
    string,
    unknown
  >;
  if (
    typeof id !== "number" ||
    typeof message !== "string" ||
    typeof createdAt !== "string"
  ) {
    throw new Error("notifications: unexpected response");
  }
  return { id, message, createdAt, read: read === true };
}

/**
 * REQ-COM-005: `GET /api/v1/notifications`로 본인 알림 최근 50개를 최신순으로 받는다.
 * 알림을 받을 학생은 서버가 로그인 세션으로 정하므로 학생 ID는 보내지 않는다. 조회만으로는 읽음 상태가
 * 바뀌지 않는다. 서버가 주는 알림 유형(`type`)은 화면에서 쓰지 않아 담지 않는다 — 문구는 `message` 그대로다.
 * 응답이 계약과 다르거나 서버 오류·네트워크 오류면 오류를 던진다.
 */
export async function fetchNotifications(): Promise<NotificationList> {
  const res = await fetch("/api/v1/notifications", { credentials: "include" });
  assertOk(res, "notifications");
  const body = (await res.json()) as {
    hasUnread?: unknown;
    notifications?: unknown;
  };
  if (!Array.isArray(body.notifications)) {
    throw new Error("notifications: unexpected response");
  }
  return {
    hasUnread: body.hasUnread === true,
    notifications: body.notifications.map(toNotification),
  };
}

/**
 * `GET /api/v1/notifications/unread`로 읽지 않은 알림이 있는지 받는다. 핸드폰 홈 종과 노트북 사이드바
 * 종의 빨간 점에 쓴다(REQ-COM-005).
 */
export async function fetchHasUnreadNotification(): Promise<boolean> {
  const res = await fetch("/api/v1/notifications/unread", {
    credentials: "include",
  });
  assertOk(res, "notificationsUnread");
  const body = (await res.json()) as { hasUnread?: unknown };
  return body.hasUnread === true;
}

/**
 * `POST /api/v1/notifications/read`로 본인의 읽지 않은 알림을 모두 읽음으로 바꾼다. 성공은 204다.
 * 알림 목록 화면에 들어올 때 부른다(REQ-COM-005 "방문하여 확인하면 미확인 표시를 해제").
 */
export async function markNotificationsRead(): Promise<void> {
  const res = await fetch("/api/v1/notifications/read", {
    method: "POST",
    credentials: "include",
  });
  assertOk(res, "notificationsRead");
}
