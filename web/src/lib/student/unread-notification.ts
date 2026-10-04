"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { fetchHasUnreadNotification } from "./notification-api";

/** 학생 화면 공통 틀(StudentShell)이 받아 온 읽지 않은 알림 여부. 틀 밖에서는 없음(false)이다. */
export const UnreadNotificationContext = createContext(false);

/** 틀 안의 화면(핸드폰 홈 종 등)이 읽지 않은 알림 여부를 꺼내 쓴다. */
export function useUnreadNotification(): boolean {
  return useContext(UnreadNotificationContext);
}

/**
 * REQ-COM-005: 화면에 들어올 때 서버에서 읽지 않은 알림 여부를 한 번 받는다
 * (`GET /api/v1/notifications/unread`). 받기 전과 실패(로그인 안 됨·학생 아님·서버 오류)는 없음으로 둔다 —
 * 빨간 점은 곁들이는 표시라 실패를 따로 알리지 않고, 로그인 이동은 각 화면이 맡는다.
 * `enabled`가 false면 서버에 묻지 않고 없음이다.
 */
export function useFetchUnreadNotification(enabled: boolean): boolean {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetchHasUnreadNotification()
      .then((value) => {
        if (!cancelled) setHasUnread(value);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return enabled && hasUnread;
}
