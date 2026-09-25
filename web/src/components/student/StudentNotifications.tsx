"use client";

import { useState } from "react";
import {
  MOCK_NOTIFICATIONS,
  type StudentNotification,
} from "@/lib/student/mock-notifications";
import { NotificationItem } from "./NotificationItem";
import { NotificationListSkeleton } from "./NotificationListSkeleton";
import { StudentEmptyState } from "./StudentEmptyState";
import { StudentErrorState } from "./StudentErrorState";
import { StudentPageHeader } from "./StudentPageHeader";
import { StudentShell } from "./StudentShell";

export type NotificationLoadStatus = "ready" | "loading" | "error";

/**
 * 학생 알림 목록(REQ-COM-005) — `뒤로가기 · 알림 제목 · 최근 알림`. 핸드폰(Figma 456:461)은
 * 흰 화면, 하단 탭 숨김(REQ-UI-004), `‹`는 알림에 들어오는 홈(/main)으로 간다(사용자 결정).
 * 노트북(460:669)은 봉사 활동과 같은 배치(가운데 폭 640px, 위 90px). 사이드바는 알림만 강조한다
 * (사용자 결정 — Figma의 마이페이지 강조는 봉사 화면을 복사하면서 남은 것으로 봄).
 * 공지 게시판(학생 공지 목록)은 없고 공지는 여기의 공지 알림으로만 보인다(REQ-SCOPE-003).
 * 조회 API가 없어 로딩·오류는 `initialStatus`로만 열어 두고, 빈 상태는 알림이 0개일 때 보인다.
 * 방문 시 미확인 표시 해제는 서버 연동 때 붙인다.
 */
export function StudentNotifications({
  initialStatus = "ready",
  notifications = MOCK_NOTIFICATIONS,
}: {
  initialStatus?: NotificationLoadStatus;
  notifications?: StudentNotification[];
}) {
  const [status, setStatus] = useState<NotificationLoadStatus>(initialStatus);

  return (
    <StudentShell showTabBar={false}>
      <main className="flex flex-1 flex-col bg-admin-surface md:items-center md:bg-transparent md:px-6 md:pt-[90px]">
        <div className="flex flex-col md:w-full md:max-w-[640px] md:gap-5">
          <StudentPageHeader title="알림" backHref="/main" />
          <div className="px-[18px] md:px-0">
            {status === "loading" && <NotificationListSkeleton />}
            {status === "error" && (
              <StudentErrorState onRetry={() => setStatus("ready")} />
            )}
            {status === "ready" && notifications.length === 0 && (
              <StudentEmptyState
                title="아직 알림이 없어요"
                description="새 알림이 오면 여기에 표시됩니다."
              />
            )}
            {status === "ready" && notifications.length > 0 && (
              <section className="flex flex-col gap-4 md:gap-5">
                <h2 className="text-[13px] leading-normal text-admin-textMuted">
                  최근 알림
                </h2>
                <ul className="flex flex-col gap-4 md:gap-5">
                  {notifications.map((n) => (
                    <NotificationItem
                      key={n.id}
                      message={n.message}
                      timeLabel={n.timeLabel}
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
