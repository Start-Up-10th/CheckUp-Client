"use client";

import { useState } from "react";
import {
  MOCK_VOLUNTEER_HISTORY,
  type VolunteerRecord,
} from "@/lib/student/mock-volunteer";
import { MOCK_STUDENT } from "@/lib/student/mock-student";
import { StudentEmptyState } from "./StudentEmptyState";
import { StudentErrorState } from "./StudentErrorState";
import { StudentPageHeader } from "./StudentPageHeader";
import { StudentShell } from "./StudentShell";
import { VolunteerCountCard } from "./VolunteerCountCard";
import { VolunteerHistoryItem } from "./VolunteerHistoryItem";
import { VolunteerHistorySkeleton } from "./VolunteerHistorySkeleton";

export type VolunteerLoadStatus = "ready" | "loading" | "error";

/**
 * 학생 봉사 활동(REQ-COM-003) — 본인 누적 횟수 카드와 `활동 내역` 목록(날짜·횟수, 최신순).
 * 핸드폰(Figma 319:278)은 흰 화면에 `‹ 봉사 활동` 헤더, 하단 탭 숨김(REQ-UI-004), 간격 16px.
 * 노트북(322:341)은 사이드바 오른쪽 가운데 폭 640px, 위 90px, 간격 20px(알림과 같은 배치).
 * 로딩(459:901)은 막대 6개만, 빈 상태(456:986)는 카드 없이 안내만 보인다(Figma 그대로).
 * 실제 조회 API가 없어 로딩·오류는 `initialStatus`로만 열어 두고 기본은 ready다.
 * "다시 시도"는 지금은 mock이라 바로 ready로 돌아간다.
 */
export function StudentVolunteer({
  initialStatus = "ready",
  history = MOCK_VOLUNTEER_HISTORY,
}: {
  initialStatus?: VolunteerLoadStatus;
  history?: VolunteerRecord[];
}) {
  const [status, setStatus] = useState<VolunteerLoadStatus>(initialStatus);

  return (
    <StudentShell showTabBar={false}>
      <main className="flex flex-1 flex-col bg-admin-surface md:items-center md:bg-transparent md:px-6 md:pt-[90px]">
        <div className="flex flex-col md:w-full md:max-w-[640px] md:gap-5">
          <StudentPageHeader title="봉사 활동" backHref="/my" />
          <div className="px-[18px] md:px-0">
            {status === "loading" && <VolunteerHistorySkeleton />}
            {status === "error" && (
              <StudentErrorState onRetry={() => setStatus("ready")} />
            )}
            {status === "ready" && history.length === 0 && (
              <StudentEmptyState
                title="아직 봉사 활동 기록이 없어요"
                description="봉사 활동을 하면 여기에 표시됩니다."
              />
            )}
            {status === "ready" && history.length > 0 && (
              <div className="flex flex-col gap-4 md:gap-5">
                <VolunteerCountCard count={MOCK_STUDENT.volunteerCount} />
                <section className="flex flex-col gap-4 md:gap-5">
                  <h2 className="text-[13px] leading-4 text-admin-textMuted">
                    활동 내역
                  </h2>
                  <ul className="flex flex-col gap-4 md:gap-5">
                    {history.map((record) => (
                      <VolunteerHistoryItem
                        key={record.id}
                        dateLabel={record.dateLabel}
                        count={record.count}
                      />
                    ))}
                  </ul>
                </section>
              </div>
            )}
          </div>
        </div>
      </main>
    </StudentShell>
  );
}
