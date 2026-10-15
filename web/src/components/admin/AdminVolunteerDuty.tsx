"use client";

import { ListRowsSkeleton } from "@/components/admin/ListRowsSkeleton";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminContentState } from "@/components/admin/AdminContentState";
import {
  ToastLayer,
  useToast,
  type ToastMessage,
} from "@/components/admin/Toast";
import { DutyCalendar } from "@/components/admin/DutyCalendar";
import { MissedAdjustmentDialog } from "@/components/admin/MissedAdjustmentDialog";
import { StudentDetailDialog } from "@/components/admin/student-management/StudentDetailDialog";
import { VolunteerDutyRow } from "@/components/admin/VolunteerDutyRow";
import { operatingDayKey, operatingDayLabel } from "@/lib/admin/operating-day";
import { useStudentManagementGateway } from "@/lib/admin/student-management-gateway";
import {
  failureToast,
  listFailureToast,
  useSingleFlight,
} from "@/lib/admin/volunteer-action";
import { useVolunteerGateway } from "@/lib/admin/volunteer-gateway";
import { designatedToday, roomLabel } from "@/lib/admin/volunteer-roster";
import { useVolunteerRoster } from "@/lib/admin/volunteer-roster-store";
import type {
  DutyRecord,
  DutyRecordStatus,
  RosterStudent,
} from "@/lib/admin/volunteer-types";

/** 서버가 이유를 알려 주지 않은 실패(Figma 06 state messages). */
const FAILURE_MESSAGE = "처리에 실패했습니다. 다시 시도해 주세요.";

/** 미이행 처리 문구. 서버에 미이행 상태가 없어 지정 제외 + 횟수 추가로 처리한다(#334). */
const MISSED_DEFAULT_REASON = "당일 봉사 미이행";
const MISSED_SUCCESS_MESSAGE = "미이행으로 처리하고 봉사 횟수를 변경했습니다.";
const MISSED_NO_CHANGE_MESSAGE = "미이행으로 처리했습니다.";
const MISSED_COUNT_FAILURE_MESSAGE =
  "당일 봉사자에서는 제외했지만 봉사 횟수 변경에 실패했습니다. 학생 관리에서 조정해 주세요.";
const COUNT_SUCCESS_MESSAGE = "봉사 횟수를 변경했습니다.";
const COUNT_FAILURE_MESSAGE =
  "봉사 횟수 변경에 실패했습니다. 다시 시도해 주세요.";
const HISTORY_UNSUPPORTED_MESSAGE =
  "지난 날짜의 봉사자 기록은 서버 지원이 준비되면 볼 수 있어요.";

const RECORD_CHIP: Record<DutyRecordStatus, { label: string; style: string }> =
  {
    completed: {
      label: "완료",
      style: "bg-admin-attendance-bg text-admin-attendance-text",
    },
    missed: {
      label: "미이행",
      style: "bg-admin-danger-bg text-admin-danger-text",
    },
    assigned: {
      label: "지정됨",
      style: "bg-admin-absence-bg text-admin-textMuted",
    },
  };

/** 횟수를 추가해 처리한 미이행의 표시(달력과 지난 기록 목록 공통). */
const ADJUSTED_CHIP = {
  label: "횟수 처리됨",
  style: "bg-admin-attendance-bg text-admin-attendance-text",
};

/** 지난 기록이 이 시간 안에 오면 스켈레톤 없이 바로 바꿔 깜빡이지 않게 한다(AdminHomeFloorPlan과 같다). */
const SKELETON_DELAY_MS = 300;

type DayRecords =
  | { key: string; status: "error" }
  | { key: string; status: "ready"; items: DutyRecord[] };

/** 당일 봉사자 목록을 받지 못했을 때(Figma 06 state messages). */
const LIST_FAILURE_MESSAGE =
  "당일 봉사자 목록을 불러오지 못했습니다. 다시 시도해 주세요.";

/**
 * REQ-COM-006: 봉사자 관리(Figma 06). 오늘 운영일의 당일 봉사자 목록이다. `완료`는 봉사를 마친 것으로
 * 처리하고 횟수를 1 줄이며(목록에서 빠진다), `봉사 제외`는 지정을 취소한다. 지정은 `+ 명단 수정`으로
 * 이동하는 봉사자 명단 편집(07)에서 한다.
 */
export function AdminVolunteerDuty({
  rosterHref = "/admin/volunteers/add",
}: {
  /** `+ 명단 수정`이 가는 봉사자 명단 편집 주소. 로그인 없이 보는 확인용 페이지에서만 바꾼다. */
  rosterHref?: string;
}) {
  const { roster, status, rateLimited, updateStudent, reload } =
    useVolunteerRoster();
  const gateway = useVolunteerGateway();
  const studentGateway = useStudentManagementGateway();
  const singleFlight = useSingleFlight();
  const { showToast } = useToast();
  const today = designatedToday(roster);
  const dayLabel = operatingDayLabel(new Date());
  const todayKey = operatingDayKey(new Date());
  const history = gateway.history;
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [dayRecords, setDayRecords] = useState<DayRecords | null>(null);
  const [historyAttempt, setHistoryAttempt] = useState(0);
  // 기록이 `SKELETON_DELAY_MS`를 넘겨도 오지 않아 스켈레톤을 보여야 하는 날.
  const [slowKey, setSlowKey] = useState<string | null>(null);
  // 이 화면에서 처리한 미이행(서버에 날짜별 기록 API가 없어 화면이 들고 있다, #334).
  const [sessionMissed, setSessionMissed] = useState<
    Record<string, DutyRecord[]>
  >({});
  const [handled, setHandled] = useState<
    Record<string, { added: number; reason: string }>
  >({});
  const [viewRecord, setViewRecord] = useState<DutyRecord | null>(null);
  const [dialog, setDialog] = useState<{
    student: RosterStudent;
    kind: "missed" | "adjust";
  } | null>(null);
  const viewingPast = selectedKey !== todayKey;
  const [, selectedMonth, selectedDay] = selectedKey.split("-").map(Number);
  const pastLabel = `${String(selectedMonth).padStart(2, "0")}/${String(selectedDay).padStart(2, "0")}`;

  useEffect(() => {
    if (!history) return;
    let cancelled = false;
    const slowTimer = setTimeout(() => {
      if (!cancelled) setSlowKey(selectedKey);
    }, SKELETON_DELAY_MS);
    history
      .day(selectedKey)
      .then((items) => {
        if (!cancelled) {
          setDayRecords({ key: selectedKey, status: "ready", items });
        }
      })
      .catch(() => {
        if (!cancelled) setDayRecords({ key: selectedKey, status: "error" });
      });
    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
    };
  }, [selectedKey, todayKey, history, historyAttempt]);

  // 고른 날의 기록이 아직 오지 않았으면 null(받는 중)이다.
  const records: DayRecords | null =
    dayRecords && dayRecords.key === selectedKey ? dayRecords : null;
  // 서버가 준 기록에 이 화면에서 처리한 미이행을 합치고, 횟수를 추가한 학생은 처리됨으로 표시한다.
  const dayItems: DutyRecord[] | null = (() => {
    const supported = history !== undefined || selectedKey === todayKey;
    if (!supported || (history && records === null)) return null;
    const server = records?.status === "ready" ? records.items : [];
    const local = sessionMissed[selectedKey] ?? [];
    const merged = [
      ...server.filter(
        (item) => !local.some((mine) => mine.studentId === item.studentId),
      ),
      ...local,
    ];
    return merged.map((item) => {
      const done = handled[`${selectedKey}:${item.studentId}`];
      if (item.status !== "missed") return item;
      if (done) {
        return {
          ...item,
          adjusted: true,
          addedCount: done.added,
          reason: done.reason,
        };
      }
      return item;
    });
  })();
  const todayMissedMarks = (sessionMissed[todayKey] ?? []).length
    ? { [todayKey]: (sessionMissed[todayKey] ?? []).length }
    : undefined;
  const missedRecords = dayItems
    ? dayItems.filter((item) => item.status === "missed")
    : null;

  function markHandled(
    dateKey: string,
    studentId: string,
    detail: { added: number; reason: string },
  ) {
    setHandled((current) => ({
      ...current,
      [`${dateKey}:${studentId}`]: detail,
    }));
  }

  function rememberMissed(student: RosterStudent, adjusted: boolean) {
    const record: DutyRecord = {
      id: student.id,
      studentId: student.studentId,
      name: student.name,
      roomNumber: student.roomNumber,
      status: "missed",
      adjusted,
    };
    setSessionMissed((current) => ({
      ...current,
      [todayKey]: [
        ...(current[todayKey] ?? []).filter(
          (item) => item.studentId !== student.studentId,
        ),
        record,
      ],
    }));
  }

  useEffect(() => {
    if (status === "error") {
      showToast(listFailureToast(rateLimited, LIST_FAILURE_MESSAGE));
    }
  }, [status, rateLimited, showToast]);

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

  function openMissed(studentId: string) {
    const student = roster.find((item) => item.studentId === studentId);
    if (student) setDialog({ student, kind: "missed" });
  }

  /** 횟수를 이미 처리한 미이행은 추가된 횟수·사유만 읽기 전용으로 보이고, 아니면 횟수를 조정한다. */
  function openAdjust(record: DutyRecord) {
    if (record.adjusted) {
      setViewRecord(record);
      return;
    }
    const student = roster.find((item) => item.studentId === record.studentId);
    if (student) setDialog({ student, kind: "adjust" });
  }

  /** 지정을 제외한 뒤 횟수와 사유를 저장한다. 이 순서라야 중간에 실패해도 횟수가 두 번 더해지지 않는다. */
  function handleMissed(change: { count: number; reason: string }) {
    if (!dialog) return;
    const { student } = dialog;
    return singleFlight(student.id, async () => {
      let released: RosterStudent;
      try {
        released = await gateway.cancelDuty(student.id);
      } catch (error) {
        const failure = failureToast(error, FAILURE_MESSAGE, reload);
        if (failure) showToast(failure);
        return;
      }
      updateStudent(released);
      setDialog(null);
      rememberMissed(student, false);
      if (change.count === student.count) {
        showToast({ variant: "success", message: MISSED_NO_CHANGE_MESSAGE });
        return;
      }
      try {
        updateStudent(await studentGateway.saveCount(released, change));
        markHandled(todayKey, student.studentId, {
          added: change.count - student.count,
          reason: change.reason,
        });
        showToast({ variant: "success", message: MISSED_SUCCESS_MESSAGE });
      } catch (error) {
        const failure = failureToast(
          error,
          MISSED_COUNT_FAILURE_MESSAGE,
          reload,
        );
        if (failure) {
          showToast(
            failure.variant === "error"
              ? { variant: "error", message: MISSED_COUNT_FAILURE_MESSAGE }
              : failure,
          );
        }
      }
    });
  }

  /** 지난 미이행 학생의 횟수·사유만 고친다(학생 관리와 같은 저장). */
  function handleAdjust(change: { count: number; reason: string }) {
    if (!dialog) return;
    const { student } = dialog;
    if (change.count === student.count) {
      setDialog(null);
      return;
    }
    return singleFlight(student.id, async () => {
      try {
        updateStudent(await studentGateway.saveCount(student, change));
        markHandled(selectedKey, student.studentId, {
          added: change.count - student.count,
          reason: change.reason,
        });
        setDialog(null);
        showToast({ variant: "success", message: COUNT_SUCCESS_MESSAGE });
      } catch (error) {
        const failure = failureToast(error, COUNT_FAILURE_MESSAGE, reload);
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
      <ToastLayer />

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
        {/* 폰·패드는 제목 옆, 컴퓨터는 아래 줄 오른쪽(Figma 06). 묶음을 격자 위치만 바꿔 쓴다. */}
        <div className="relative col-start-2 row-start-1 flex items-center gap-2 xl:row-start-2">
          <DutyCalendar
            todayKey={todayKey}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
            loadMonth={history?.month}
            extraMarks={todayMissedMarks}
            missed={missedRecords}
            onPickMissed={openAdjust}
          />
          <Link
            href={rosterHref}
            aria-label="+ 명단 수정"
            className="rounded-[10px] bg-admin-accent-bg transition hover:brightness-95 px-3.5 py-2 text-xs font-bold leading-[14px] text-admin-accent-text md:text-[13px] md:leading-4 xl:px-[18px] xl:py-[9px]"
          >
            <span className="md:hidden">+ 수정</span>
            <span className="hidden md:inline">+ 명단 수정</span>
          </Link>
        </div>
        <div className="hidden items-center gap-2 xl:col-start-1 xl:row-start-2 xl:flex">
          <h2 className="text-[15px] font-bold leading-[18px] text-admin-text">
            {viewingPast
              ? `${pastLabel} 봉사자 기록`
              : `${dayLabel} 당일 봉사자`}
          </h2>
          <p className="font-mono text-xs leading-4 text-admin-textMuted">
            {viewingPast
              ? dayItems
                ? `${dayItems.length}명`
                : ""
              : `${today.length}명`}
          </p>
        </div>
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col gap-2.5 overflow-y-auto [scrollbar-gutter:stable] md:gap-3.5 rounded-[16px] bg-admin-surface p-3.5 pt-4 md:rounded-[18px] md:p-5 xl:gap-0 xl:rounded-panel xl:p-[22px]">
        <div
          className={`flex items-center justify-between gap-2 ${viewingPast ? "" : "xl:hidden"}`}
        >
          <p className="text-[11px] leading-[13px] text-admin-textSecondary md:text-xs md:leading-[14px] xl:hidden">
            {viewingPast
              ? `${pastLabel} 봉사자 기록${dayItems ? ` · ${dayItems.length}명` : ""}`
              : `${dayLabel} 당일 봉사자 · ${today.length}명`}
          </p>
          {viewingPast && (
            <button
              type="button"
              onClick={() => setSelectedKey(todayKey)}
              className="ml-auto -translate-y-2 shrink-0 rounded-[10px] bg-admin-ghost-bg px-3 py-1.5 text-xs font-bold leading-[14px] text-admin-ghost-text transition-colors hover:bg-admin-border"
            >
              오늘로 돌아가기
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {viewingPast ? (
            !history ? (
              <AdminContentState
                variant="empty"
                description={HISTORY_UNSUPPORTED_MESSAGE}
              />
            ) : dayItems === null && records?.status !== "error" ? (
              slowKey === selectedKey ? (
                <ListRowsSkeleton />
              ) : null
            ) : records?.status === "error" ? (
              <AdminContentState
                variant="error"
                onRetry={() => {
                  setDayRecords(null);
                  setHistoryAttempt((count) => count + 1);
                }}
              />
            ) : dayItems === null || dayItems.length === 0 ? (
              <AdminContentState
                variant="empty"
                description="이 날 지정된 봉사자가 없습니다."
              />
            ) : (
              dayItems.map((record) => {
                const chip = record.adjusted
                  ? ADJUSTED_CHIP
                  : RECORD_CHIP[record.status];
                const adjustable =
                  record.status === "missed" &&
                  (record.adjusted ||
                    roster.some((item) => item.studentId === record.studentId));
                const body = (
                  <>
                    <span className="flex min-w-0 flex-col gap-0.5 whitespace-nowrap">
                      <span className="text-[13px] font-bold leading-4 text-admin-text md:text-sm md:leading-[17px] xl:text-[15px] xl:leading-[18px]">
                        {record.name}
                      </span>
                      <span className="font-mono text-[10px] leading-[13px] text-admin-textMuted md:text-[11px] md:leading-[15px] xl:text-xs xl:leading-4">
                        {record.studentId} · {roomLabel(record.roomNumber)}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold leading-[14px] ${chip.style}`}
                      >
                        {chip.label}
                      </span>
                      {adjustable && (
                        <span
                          aria-hidden="true"
                          className="text-admin-textFaint"
                        >
                          ›
                        </span>
                      )}
                    </span>
                  </>
                );
                const base =
                  "flex w-full items-center justify-between gap-3 rounded-[11px] bg-admin-rowSurface px-3.5 py-[11px] text-left md:rounded-xl md:px-4 md:py-3 xl:rounded-card xl:px-5 xl:py-3.5";
                return adjustable ? (
                  <button
                    key={record.studentId}
                    type="button"
                    aria-label={`${record.name} 미이행 횟수 조정`}
                    onClick={() => openAdjust(record)}
                    className={`${base} transition-colors hover:bg-admin-divider`}
                  >
                    {body}
                  </button>
                ) : (
                  <div key={record.studentId} className={base}>
                    {body}
                  </div>
                );
              })
            )
          ) : status === "error" ? (
            <AdminContentState variant="error" onRetry={reload} />
          ) : status !== "ready" ? (
            <ListRowsSkeleton />
          ) : today.length === 0 ? (
            <AdminContentState
              variant="empty"
              description="오늘 지정된 봉사자가 없습니다. 봉사자 명단에서 지정해 주세요."
            />
          ) : (
            today.map((student) => (
              <VolunteerDutyRow
                key={student.studentId}
                student={student}
                onComplete={handleComplete}
                onCancel={handleCancel}
                onMissed={openMissed}
              />
            ))
          )}
        </div>
      </div>

      {viewRecord ? (
        <MissedAdjustmentDialog
          record={viewRecord}
          onClose={() => setViewRecord(null)}
        />
      ) : null}

      {dialog ? (
        <StudentDetailDialog
          key={`${dialog.kind}-${dialog.student.studentId}`}
          student={dialog.student}
          onClose={() => setDialog(null)}
          onSave={dialog.kind === "missed" ? handleMissed : handleAdjust}
          initialCount={
            dialog.kind === "missed" ? dialog.student.count + 1 : undefined
          }
          initialReason={
            dialog.kind === "missed" ? MISSED_DEFAULT_REASON : undefined
          }
        />
      ) : null}
    </div>
  );
}
