"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  NotificationLoginRequiredError,
  NotificationNotStudentError,
  fetchNotifications,
  markNotificationsRead,
} from "@/lib/student/notification-api";
import { toNotificationTimeLabel } from "@/lib/student/notification-time";
import { NotificationItem } from "./NotificationItem";
import { NotificationListSkeleton } from "./NotificationListSkeleton";
import { StudentEmptyState } from "./StudentEmptyState";
import { StudentErrorState } from "./StudentErrorState";
import { StudentPageHeader } from "./StudentPageHeader";
import { StudentShell } from "./StudentShell";

type NotificationRow = { id: number; message: string; timeLabel: string };

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "notStudent" }
  | { status: "ready"; rows: NotificationRow[] };

/**
 * 학생 알림 목록(REQ-COM-005) — `뒤로가기 · 알림 제목 · 최근 알림`. 핸드폰(Figma 456:461)은
 * 흰 화면, 하단 탭 숨김(REQ-UI-004), `‹`는 알림에 들어오는 홈(/main)으로 간다(사용자 결정).
 * 노트북(460:669)은 봉사 활동과 같은 배치(가운데 폭 640px, 위 90px). 사이드바는 알림만 강조한다
 * (사용자 결정 — Figma의 마이페이지 강조는 봉사 화면을 복사하면서 남은 것으로 봄).
 * 공지 게시판(학생 공지 목록)은 없고 공지는 여기의 공지 알림으로만 보인다(REQ-SCOPE-003).
 *
 * 들어오면 서버에서 본인 알림을 받아(`GET /api/v1/notifications`) 불러오는 중 → 목록·빈 상태·실패로 바뀐다.
 * 문구는 서버 `message` 그대로, 시각은 서버 `createdAt`으로 계산한 상대 시각이다.
 * 목록을 받았고 읽지 않은 알림이 있으면 전체 읽음(`POST /api/v1/notifications/read`)을 보낸다 — 방문해서
 * 확인하면 미확인 표시를 해제한다. 읽음 처리가 실패해도 목록은 그대로 보여 준다(다음 방문 때 다시 보낸다).
 * 로그인이 안 돼 있으면(401) 로그인 화면으로 보낸다. 실패는 공통 오류/다시 시도(REQ-UI-006)이고,
 * 학생이 아닌 계정(403, 교사 등)은 Figma에 없어 동의 화면과 같은 말투의 문구를 같은 자리에 보여 준다.
 */
export function StudentNotifications() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchNotifications()
      .then(({ hasUnread, notifications }) => {
        if (cancelled) return;
        const now = new Date();
        setState({
          status: "ready",
          rows: notifications.map(({ id, message, createdAt }) => ({
            id,
            message,
            timeLabel: toNotificationTimeLabel(createdAt, now),
          })),
        });
        if (hasUnread) markNotificationsRead().catch(() => {});
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        if (reason instanceof NotificationLoginRequiredError) {
          router.replace("/login");
          return;
        }
        setState({
          status:
            reason instanceof NotificationNotStudentError
              ? "notStudent"
              : "error",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt, router]);

  const retry = () => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  };

  return (
    <StudentShell showTabBar={false}>
      <main className="flex flex-1 flex-col bg-admin-surface md:items-center md:bg-transparent md:px-6 md:pt-[90px]">
        <div className="flex flex-col md:w-full md:max-w-[640px] md:gap-5">
          <StudentPageHeader title="알림" backHref="/main" />
          <div className="px-[18px] md:px-0">
            {state.status === "loading" && <NotificationListSkeleton />}
            {state.status === "error" && <StudentErrorState onRetry={retry} />}
            {state.status === "notStudent" && (
              <StudentErrorState
                title="학생 계정만 이용할 수 있어요"
                description="학생 계정으로 로그인해 주세요."
                onRetry={retry}
              />
            )}
            {state.status === "ready" && state.rows.length === 0 && (
              <StudentEmptyState
                title="아직 알림이 없어요"
                description="새 알림이 오면 여기에 표시됩니다."
              />
            )}
            {state.status === "ready" && state.rows.length > 0 && (
              <section className="flex flex-col gap-4 md:gap-5">
                <h2 className="text-[13px] leading-4 text-admin-textMuted">
                  최근 알림
                </h2>
                <ul className="flex flex-col gap-4 md:gap-5">
                  {state.rows.map((row) => (
                    <NotificationItem
                      key={row.id}
                      message={row.message}
                      timeLabel={row.timeLabel}
                    />
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </main>
    </StudentShell>
  );
}
