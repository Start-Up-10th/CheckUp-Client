"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusBanner } from "@/components/admin/StatusBanner";
import { useCurrentStudent } from "@/lib/student/current-student";
import {
  VolunteerLoginRequiredError,
  fetchRemainingVolunteerCount,
  fetchVolunteerHistory,
  type VolunteerRecord,
} from "@/lib/student/volunteer-api";
import { StudentEmptyState } from "./StudentEmptyState";
import { StudentErrorState } from "./StudentErrorState";
import { StudentPageHeader } from "./StudentPageHeader";
import { StudentShell } from "./StudentShell";
import { VolunteerCountCard } from "./VolunteerCountCard";
import { VolunteerHistoryItem } from "./VolunteerHistoryItem";
import { VolunteerHistorySkeleton } from "./VolunteerHistorySkeleton";

const LOAD_FAILED_MESSAGE = "봉사 활동 내역을 불러오지 못했습니다.";

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; remaining: number; history: VolunteerRecord[] };

/**
 * 학생 봉사 활동(REQ-COM-003) — 본인 남은 봉사 횟수 카드와 `활동 내역` 목록(완료한 봉사의 날짜·횟수, 최신순).
 * 핸드폰(Figma 319:278)은 흰 화면에 `‹ 봉사 활동` 헤더, 하단 탭 숨김(REQ-UI-004), 간격 16px.
 * 노트북(322:341)은 사이드바 오른쪽 가운데 폭 640px, 위 90px, 간격 20px(알림과 같은 배치).
 *
 * 봉사는 기숙사 벌칙이라 카드는 앞으로 해야 할 횟수를 보이고(DEC-020·021), 활동 내역은 자치위원이 완료를
 * 확인한 봉사다(사용자 결정 2026-10-04 — Figma의 `누적 봉사 횟수` 문구를 `남은 봉사 횟수`로 바꿈).
 * 본인 DataGSM 학생 id(공통 틀의 `/api/v1/auth/me`)로 `GET /api/v1/users/{id}/volunteer`와
 * `…/volunteer/history`를 함께 받는다. 로딩(459:901)은 막대 6개, 실패(459:949)는 공통 오류/다시 시도,
 * 로그인이 안 돼 있으면 로그인 화면으로 보낸다. 내역이 없어도 남은 횟수는 알아야 해서 카드는 그대로 두고
 * 목록 자리에만 빈 상태를 보인다(Figma 빈 상태 456:986은 카드 없이 안내만 있어 정한 값).
 */
export function StudentVolunteer() {
  return (
    <StudentShell showTabBar={false}>
      <StudentVolunteerContent />
    </StudentShell>
  );
}

/** 공통 틀 안에서 본인 정보를 꺼내 쓰는 봉사 활동 본문. */
function StudentVolunteerContent() {
  const router = useRouter();
  const current = useCurrentStudent();
  const studentId =
    current.status === "ready" ? (current.profile?.studentId ?? null) : null;
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (current.status === "unauthenticated") router.replace("/login");
  }, [current.status, router]);

  useEffect(() => {
    if (studentId === null) return;
    let cancelled = false;
    Promise.all([
      fetchRemainingVolunteerCount(studentId),
      fetchVolunteerHistory(studentId),
    ])
      .then(([remaining, history]) => {
        if (!cancelled) setState({ status: "ready", remaining, history });
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        if (reason instanceof VolunteerLoginRequiredError) {
          router.replace("/login");
        } else {
          setState({ status: "error" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [studentId, attempt, router]);

  // 본인 정보를 받지 못했거나 학생 id가 없으면 조회할 수 없어 실패로 본다.
  const failed =
    state.status === "error" ||
    current.status === "error" ||
    (current.status === "ready" && studentId === null);
  const retry = () => {
    if (current.status !== "ready" || studentId === null) {
      window.location.reload();
      return;
    }
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  };

  return (
    <main className="flex flex-1 flex-col bg-admin-surface md:items-center md:bg-transparent md:px-6 md:pt-[90px]">
      <div className="flex flex-col md:w-full md:max-w-[640px] md:gap-5">
        <StudentPageHeader title="봉사 활동" backHref="/my" />
        <div className="px-[18px] md:px-0">
          {failed ? (
            <StudentErrorState onRetry={retry} />
          ) : state.status !== "ready" ? (
            <VolunteerHistorySkeleton />
          ) : (
            <div className="flex flex-col gap-4 md:gap-5">
              <VolunteerCountCard count={state.remaining} />
              <section className="flex flex-col gap-4 md:gap-5">
                <h2 className="text-[13px] leading-4 text-admin-textMuted">
                  활동 내역
                </h2>
                {state.history.length === 0 ? (
                  <StudentEmptyState
                    title="아직 봉사 활동 기록이 없어요"
                    description="봉사 활동을 하면 여기에 표시됩니다."
                  />
                ) : (
                  <ul className="flex flex-col gap-4 md:gap-5">
                    {state.history.map((record) => (
                      <VolunteerHistoryItem
                        key={record.id}
                        dateLabel={record.dateLabel}
                        count={record.count}
                      />
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
      {failed && (
        <div className="pointer-events-none fixed inset-x-[18px] bottom-[18px] z-40 md:inset-x-auto md:bottom-auto md:right-8 md:top-8 md:w-[380px]">
          <StatusBanner variant="error" message={LOAD_FAILED_MESSAGE} />
        </div>
      )}
    </main>
  );
}
