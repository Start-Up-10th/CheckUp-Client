"use client";

import { useCallback, useRef } from "react";
import { redirectToAdminLogin } from "@/lib/admin/admin-session";
import type { ToastMessage } from "@/components/admin/Toast";
import { AdminUnauthorizedError } from "@/lib/admin/qr-api";
import { RATE_LIMIT_MESSAGE, RateLimitedError } from "@/lib/rate-limit";
import { VolunteerApiError } from "@/lib/admin/volunteer-api";

/** 서버가 막은 이유별 안내(Figma 07 state messages, 봉사 없음·완료는 하네스 REQ-COM-006 문구). */
const REFUSAL_MESSAGE: Record<string, string> = {
  ALREADY_ON_DUTY: "이미 당일 봉사자로 지정된 학생입니다.",
  NO_VOLUNTEER_LEFT: "봉사가 없습니다.",
  DUTY_ALREADY_COMPLETED: "이미 봉사를 완료했습니다.",
};

/**
 * 봉사 동작이 실패했을 때 띄울 상태 메시지를 정한다. 401이면 관리자 로그인으로 보내고 null을 돌려준다.
 * 요청이 너무 많다는 안내(429)는 `잠시 후 다시 시도해 주세요.`(neutral)이고 명단은 다시 받지 않는다.
 * 서버가 알려 준 이유(409)는 안내(neutral), 그 밖의 실패는 `fallback` 오류 문구다. 서버 상태와 어긋난 경우
 * (404·409)에는 `onStale`로 명단을 다시 받게 한다.
 */
export function failureToast(
  error: unknown,
  fallback: string,
  onStale: () => void,
): ToastMessage | null {
  if (error instanceof AdminUnauthorizedError) {
    redirectToAdminLogin();
    return null;
  }
  if (error instanceof RateLimitedError) {
    return { variant: "neutral", message: RATE_LIMIT_MESSAGE };
  }
  if (error instanceof VolunteerApiError) {
    if (error.status === 404 || error.status === 409) onStale();
    const refusal = error.code ? REFUSAL_MESSAGE[error.code] : undefined;
    if (refusal) return { variant: "neutral", message: refusal };
  }
  return { variant: "error", message: fallback };
}

/** 명단 조회 실패 안내. 요청이 너무 많아서(429)면 `잠시 후 다시 시도해 주세요.`, 그 밖에는 `message` 오류 문구다. */
export function listFailureToast(
  rateLimited: boolean,
  message: string,
): ToastMessage {
  return rateLimited
    ? { variant: "neutral", message: RATE_LIMIT_MESSAGE }
    : { variant: "error", message };
}

/** 같은 학생에 대한 요청이 끝나기 전의 중복 클릭을 막는다. */
export function useSingleFlight() {
  const running = useRef(new Set<number>());
  return useCallback(async (key: number, task: () => Promise<void>) => {
    if (running.current.has(key)) return;
    running.current.add(key);
    try {
      await task();
    } finally {
      running.current.delete(key);
    }
  }, []);
}
