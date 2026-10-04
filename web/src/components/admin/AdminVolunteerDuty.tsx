"use client";

import Link from "next/link";
import { AdminContentState } from "@/components/admin/AdminContentState";
import { StatusBanner } from "@/components/admin/StatusBanner";
import {
  ToastLayer,
  useToast,
  type ToastMessage,
} from "@/components/admin/Toast";
import { VolunteerDutyRow } from "@/components/admin/VolunteerDutyRow";
import { operatingDayLabel } from "@/lib/admin/operating-day";
import { failureToast, useSingleFlight } from "@/lib/admin/volunteer-action";
import { useVolunteerGateway } from "@/lib/admin/volunteer-gateway";
import { designatedToday } from "@/lib/admin/volunteer-roster";
import { useVolunteerRoster } from "@/lib/admin/volunteer-roster-store";
import type { RosterStudent } from "@/lib/admin/volunteer-types";

/** 서버가 이유를 알려 주지 않은 실패(Figma 06 state messages). */
const FAILURE_MESSAGE = "처리에 실패했습니다. 다시 시도해 주세요.";

/**
 * 토스트는 헤더 조작부(`+ 명단에서 지정` 버튼) 바로 아래, 목록 행 위에 둔다. 폰 58px(버튼 하단 50px + 8px),
 * 패드 89px(헤더 하단 81px + 8px), 컴퓨터는 버튼이 아래 줄(103px)에 있어 제목 줄 오른쪽 위 28px이다.
 */
const TOAST_POSITION =
  "inset-x-4 top-[58px] justify-end md:left-[96px] md:right-[22px] md:top-[89px] md:justify-end xl:left-[300px] xl:right-8 xl:top-7";

/**
 * REQ-COM-006: 봉사자 관리(Figma 06). 오늘 운영일의 당일 봉사자 목록이다. `완료`는 봉사를 마친 것으로
 * 처리하고 횟수를 1 줄이며(목록에서 빠진다), `봉사 제외`는 지정을 취소한다. 지정은 `+ 명단에서 지정`으로
 * 이동하는 봉사자 명단 편집(07)에서 한다.
 */
export function AdminVolunteerDuty({
  rosterHref = "/admin/volunteers/add",
}: {
  /** `+ 명단에서 지정`이 가는 봉사자 명단 편집 주소. 로그인 없이 보는 확인용 페이지에서만 바꾼다. */
  rosterHref?: string;
}) {
  const { roster, status, updateStudent, reload } = useVolunteerRoster();
  const gateway = useVolunteerGateway();
  const singleFlight = useSingleFlight();
  const { toast, showToast } = useToast();
  const today = designatedToday(roster);
  const dayLabel = operatingDayLabel(new Date());

  /** 서버에 요청하고, 서버가 돌려준 학생 상태를 명단에 넣는다. 실패는 상태 메시지로 알린다. */
  function runDutyAction(
    studentId: string,
    request: (id: number) => Promise<RosterStudent>,
    successMessage: ToastMessage,
  ) {
    const target = roster.find((student) => student.studentId === studentId);
    if (!target) return;
    return singleFlight(target.id, async () => {
      try {
        const updated = await request(target.id);
        updateStudent(updated);
        showToast(successMessage);
      } catch (error) {
        const failure = failureToast(error, FAILURE_MESSAGE, reload);
        if (failure) showToast(failure);
      }
    });
  }

  function handleComplete(studentId: string) {
    return runDutyAction(studentId, gateway.completeDuty, {
      variant: "success",
      message: "봉사를 완료 처리했습니다.",
    });
  }

  function handleCancel(studentId: string) {
    return runDutyAction(studentId, gateway.cancelDuty, {
      variant: "neutral",
      message: "당일 봉사자에서 제외했습니다.",
    });
  }

  return (
    <div className="flex h-full w-full flex-col gap-3.5 px-4 py-3.5 md:gap-4 md:px-[22px] md:py-6 xl:gap-5 xl:px-8 xl:py-7">
      <ToastLayer toast={toast} positionClassName={TOAST_POSITION} />

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 md:min-h-[57px] xl:min-h-0 xl:gap-y-5">
        <div className="flex flex-col gap-0.5 md:gap-[3px] xl:gap-1">
          <p className="font-mono text-[10px] leading-[13px] tracking-[1.6px] text-admin-textFaint md:tracking-[1.8px] xl:text-[11px] xl:leading-[15px] xl:tracking-[1.98px]">
            <span className="md:hidden">ADMIN</span>
            <span className="hidden md:inline">VOLUNTEER</span>
          </p>
          <h1 className="text-[22px] font-bold leading-[26px] tracking-[-0.44px] text-admin-text md:text-[26px] md:leading-[31px] md:tracking-[-0.78px] xl:text-[30px] xl:leading-[36px] xl:tracking-[-0.9px]">
            봉사자 관리
          </h1>
        </div>
        {/* 폰·패드는 제목 옆, 컴퓨터는 아래 줄 오른쪽(Figma 06). 링크 하나를 격자 위치만 바꿔 쓴다. */}
        <Link
          href={rosterHref}
          aria-label="+ 명단에서 지정"
          className="col-start-2 row-start-1 rounded-[10px] bg-admin-accent-bg px-3.5 py-2 text-xs font-bold leading-[14px] text-admin-accent-text md:text-[13px] md:leading-4 xl:row-start-2 xl:px-[18px] xl:py-[9px]"
        >
          <span className="md:hidden">+ 지정</span>
          <span className="hidden md:inline">+ 명단에서 지정</span>
        </Link>
        <div className="hidden items-center gap-2 xl:col-start-1 xl:row-start-2 xl:flex">
          <h2 className="text-[15px] font-bold leading-[18px] text-admin-text">
            {dayLabel} 당일 봉사자
          </h2>
          <p className="font-mono text-xs leading-4 text-admin-textMuted">
            {today.length}명
          </p>
        </div>
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col gap-2.5 overflow-y-auto md:gap-3.5 rounded-[16px] bg-admin-surface p-3.5 pt-4 md:rounded-[18px] md:p-5 xl:gap-0 xl:rounded-panel xl:p-[22px]">
        <p className="text-[11px] leading-[13px] text-admin-textSecondary md:text-xs md:leading-[14px] xl:hidden">
          {dayLabel} 당일 봉사자 · {today.length}명
        </p>
        <div className="flex flex-col gap-2">
          {status === "error" ? (
            <AdminContentState variant="error" onRetry={reload} />
          ) : status !== "ready" ? (
            <p className="py-6 text-center text-sm text-admin-textMuted">
              불러오는 중…
            </p>
          ) : today.length === 0 ? (
            <StatusBanner
              variant="neutral"
              compactOnPhone
              message="오늘 지정된 봉사자가 없습니다. 봉사자 명단에서 지정해 주세요."
            />
          ) : (
            today.map((student) => (
              <VolunteerDutyRow
                key={student.studentId}
                student={student}
                onComplete={handleComplete}
                onCancel={handleCancel}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
