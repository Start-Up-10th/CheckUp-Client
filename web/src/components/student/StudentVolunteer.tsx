"use client";

import { useState } from "react";
import { MOCK_STUDENT } from "@/lib/student/mock-student";
import { StudentErrorState } from "./StudentErrorState";
import { StudentPageHeader } from "./StudentPageHeader";
import { StudentShell } from "./StudentShell";
import {
  VolunteerCountCard,
  VolunteerCountCardSkeleton,
} from "./VolunteerCountCard";

export type VolunteerLoadStatus = "ready" | "loading" | "error";

/**
 * 학생 봉사 활동(REQ-COM-003) — 본인 누적 횟수만 보여 준다(DEC-014, 활동 내역 목록 없음).
 * 핸드폰(Figma 319:278)은 흰 화면에 `‹ 봉사 활동` 헤더, 하단 탭 숨김(REQ-UI-004).
 * 노트북(322:341)은 사이드바 오른쪽 가운데 폭 640px, 위 90px에 제목·카드(마이페이지와 같은 배치).
 * 실제 조회 API가 없어 로딩·오류는 `initialStatus`로만 열어 두고 기본은 ready다.
 * "다시 시도"는 지금은 mock이라 바로 ready로 돌아간다.
 */
export function StudentVolunteer({
  initialStatus = "ready",
}: {
  initialStatus?: VolunteerLoadStatus;
}) {
  const [status, setStatus] = useState<VolunteerLoadStatus>(initialStatus);

  return (
    <StudentShell showTabBar={false}>
      <main className="flex flex-1 flex-col bg-admin-surface md:items-center md:bg-transparent md:px-6 md:pt-[90px]">
        <div className="flex flex-col md:w-full md:max-w-[640px] md:gap-5">
          <StudentPageHeader title="봉사 활동" backHref="/my" />
          <div className="px-[18px] md:px-0">
            {status === "loading" && <VolunteerCountCardSkeleton />}
            {status === "error" && (
              <StudentErrorState onRetry={() => setStatus("ready")} />
            )}
            {status === "ready" && (
              <VolunteerCountCard count={MOCK_STUDENT.volunteerCount} />
            )}
          </div>
        </div>
      </main>
    </StudentShell>
  );
}
