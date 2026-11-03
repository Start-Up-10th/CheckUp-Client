"use client";

import { ListRowsSkeleton } from "@/components/admin/ListRowsSkeleton";
import { useEffect, useMemo, useState } from "react";
import { AdminContentState } from "@/components/admin/AdminContentState";
import { FloorTabs } from "@/components/admin/FloorTabs";
import { ToastLayer, useToast } from "@/components/admin/Toast";
import { VolunteerDesignatedBar } from "@/components/admin/VolunteerDesignatedBar";
import { VolunteerRosterRow } from "@/components/admin/VolunteerRosterRow";
import { VolunteerHistory } from "@/components/admin/VolunteerHistory";
import {
  StudentDetailDialog,
  type StudentDialogValue,
} from "@/components/admin/student-management/StudentDetailDialog";
import type { Floor } from "@/lib/admin/floor-types";
import {
  PartialSaveError,
  type StudentCountChange,
  useStudentManagementGateway,
} from "@/lib/admin/student-management-gateway";
import {
  failureToast,
  listFailureToast,
  useSingleFlight,
} from "@/lib/admin/volunteer-action";
import {
  buildVolunteerHistoryCsv,
  collectVolunteerHistory,
  downloadCsv,
} from "@/lib/admin/volunteer-export";
import { useVolunteerGateway } from "@/lib/admin/volunteer-gateway";
import { useVolunteerHistoryGateway } from "@/lib/admin/volunteer-history-gateway";
import { groupByRoom } from "@/lib/admin/volunteer-roster";
import { useVolunteerRoster } from "@/lib/admin/volunteer-roster-store";
import type { RosterStudent } from "@/lib/admin/volunteer-types";

const DEFAULT_FLOOR: Floor = 3;

/** 명단을 서버에서 받지 못했을 때(Figma 07 state messages). */
const LIST_FAILURE_MESSAGE =
  "학생 명단을 불러오지 못했습니다. 다시 시도해 주세요.";

/** 서버가 이유를 알려 주지 않은 지정 실패(Figma 07 state messages). */
const DESIGNATE_FAILURE_MESSAGE =
  "당일 봉사자 지정에 실패했습니다. 다시 시도해 주세요.";

/** 횟수 저장 문구(Figma 08 state messages, DEC-114). */
const COUNT_SUCCESS_MESSAGE = "봉사 횟수를 변경했습니다.";
const COUNT_FAILURE_MESSAGE =
  "봉사 횟수 변경에 실패했습니다. 다시 시도해 주세요.";
const CONSECUTIVE_SUCCESS_MESSAGE = "연속 봉사 횟수를 변경했습니다.";
const CONSECUTIVE_FAILURE_MESSAGE =
  "연속 봉사 횟수 변경에 실패했습니다. 다시 시도해 주세요.";
const EXPORT_FAILURE_MESSAGE =
  "봉사 이력을 내려받지 못했습니다. 다시 시도해 주세요.";

/**
 * REQ-COM-001: 봉사자 명단 편집(Figma 07). 전체 학생을 층 탭·검색으로 거르고 호실별로 묶어 보여 준다.
 * 학생 행(횟수 칩 `N회 ✎`)을 누르면 상세 다이얼로그에서 봉사·연속 봉사 횟수와 사유를 정해 저장하고 봉사 이력을 본다
 * (학생 관리(08)를 합침, DEC-116). 저장은 서버의 지금 횟수에서 변화를 계산해 일반은 `PATCH /api/v1/volunteer/{id}/count`,
 * 연속은 `PATCH /consecutive/count`로 따로 보낸다. 다이얼로그를 연 때와 달라진 칸만, 관리자가 바꾼 만큼 보낸다. 일부만
 * 반영되고 실패하면 반영된 값을 기준으로 삼아 다시 저장해도 같은 변화를 두 번 보내지 않는다.
 * 아래 `당일 지정 N명 · 봉사자 관리 →` 바는 이 화면에서 `봉사자 지정`을 한 뒤에만 뜬다(처음 들어오면 없고, 봉사자 관리에
 * 다녀와서 다시 들어오면 지정하기 전까지 숨는다). 명단에 학생을 추가·제외하는 단계는 없다.
 */
export function AdminVolunteerRoster() {
  const { roster, status, rateLimited, updateStudent, reload } =
    useVolunteerRoster();
  const [floor, setFloor] = useState<Floor>(DEFAULT_FLOOR);
  const [query, setQuery] = useState("");
  // 다이얼로그를 연 때의 학생 상태. 저장은 이 값에서 바꾼 만큼만 보내 그사이 다른 곳의 변경(`완료` 등)을 지우지
  // 않는다. 명단을 다시 받아도 바꾸지 않고, 일부만 저장되고 실패하면 반영된 만큼 옮긴다.
  const [selected, setSelected] = useState<RosterStudent | null>(null);
  // 이 방문에서 `봉사자 지정`을 한 번이라도 성공했는지. 화면을 떠났다 돌아오면 다시 false다.
  const [designatedHere, setDesignatedHere] = useState(false);
  const [exporting, setExporting] = useState(false);
  const gateway = useVolunteerGateway();
  const historyGateway = useVolunteerHistoryGateway();
  const countGateway = useStudentManagementGateway();
  const singleFlight = useSingleFlight();
  const { showToast } = useToast();
  // 다시 받은 명단에 학생이 없으면(삭제 등) 다이얼로그를 보이지 않는다.
  const dialogStudent =
    selected &&
    (status !== "ready" || roster.some((student) => student.id === selected.id))
      ? selected
      : null;
  // 봉사자 관리(06)가 보여 주는 사람과 같게, 완료한 학생은 빼고 아직 완료하지 않은 지정만 센다.
  const designatedCount = roster.filter(
    (student) => student.duty === "designated",
  ).length;

  const barVisible = designatedHere && designatedCount > 0;

  const groups = useMemo(
    () => groupByRoom(roster, { floor, query }),
    [roster, floor, query],
  );

  useEffect(() => {
    if (status === "error") {
      showToast(listFailureToast(rateLimited, LIST_FAILURE_MESSAGE));
    }
  }, [status, rateLimited, showToast]);

  function openStudent(studentId: string) {
    setSelected(
      roster.find((student) => student.studentId === studentId) ?? null,
    );
  }

  function handleSave(dialogValue: StudentDialogValue) {
    if (!selected) return;
    const countChanged = dialogValue.count !== selected.count;
    const consecutiveChanged =
      (dialogValue.consecutiveCount ?? 0) !== (selected.consecutiveCount ?? 0);
    if (!countChanged && !consecutiveChanged) {
      setSelected(null);
      return;
    }
    const change: StudentCountChange = {
      reason: dialogValue.reason,
      ...(countChanged ? { count: dialogValue.count } : {}),
      ...(consecutiveChanged
        ? { consecutiveCount: dialogValue.consecutiveCount }
        : {}),
    };
    // 연속 횟수만 바꿨을 때만 연속 문구를 쓴다. 둘 다 바꿨으면 일반 문구다.
    const onlyConsecutive = consecutiveChanged && !countChanged;
    return singleFlight(selected.id, async () => {
      try {
        const updated = await countGateway.saveCount(selected, change);
        updateStudent(updated);
        setSelected(null);
        showToast({
          variant: "success",
          message: onlyConsecutive
            ? CONSECUTIVE_SUCCESS_MESSAGE
            : COUNT_SUCCESS_MESSAGE,
        });
      } catch (error) {
        let failedConsecutive = onlyConsecutive;
        let cause = error;
        if (error instanceof PartialSaveError) {
          // 반영된 만큼을 명단과 기준값에 넣어, 다시 저장하면 남은 변화만 보낸다.
          updateStudent(error.latest);
          setSelected(error.saved);
          failedConsecutive = error.failed === "consecutive";
          cause = error.cause;
        }
        const failure = failureToast(
          cause,
          failedConsecutive
            ? CONSECUTIVE_FAILURE_MESSAGE
            : COUNT_FAILURE_MESSAGE,
          reload,
        );
        if (failure) showToast(failure);
      }
    });
  }

  // #409: 전체 학생(층·검색과 무관)의 이력을 모아 엑셀(CSV)로 내려받는다.
  async function handleExport() {
    setExporting(true);
    try {
      downloadCsv(
        buildVolunteerHistoryCsv(
          await collectVolunteerHistory(roster, historyGateway),
        ),
      );
    } catch (error) {
      const failure = failureToast(error, EXPORT_FAILURE_MESSAGE, reload);
      if (failure) showToast(failure);
    } finally {
      setExporting(false);
    }
  }

  function handleDesignate(studentId: string) {
    const target = roster.find((student) => student.studentId === studentId);
    if (!target) return;
    return singleFlight(target.id, async () => {
      try {
        const updated = await gateway.designate(target.id);
        updateStudent(updated);
        setDesignatedHere(true);
        showToast({
          variant: "success",
          message: "당일 봉사자로 지정했습니다.",
        });
      } catch (error) {
        const failure = failureToast(error, DESIGNATE_FAILURE_MESSAGE, reload);
        if (failure) showToast(failure);
      }
    });
  }

  return (
    <div className="relative flex h-full w-full flex-col gap-3.5 px-4 py-3.5 md:gap-4 md:px-[22px] md:py-6 xl:gap-5 xl:px-8 xl:py-7">
      <ToastLayer />

      <div className="flex w-full items-end justify-between">
        <div className="flex flex-col gap-0.5 md:gap-[3px] xl:gap-1">
          <h1 className="text-[22px] font-bold leading-[26px] tracking-[-0.44px] text-admin-text md:text-[26px] md:leading-[31px] md:tracking-[-0.78px] xl:text-[30px] xl:leading-[36px] xl:tracking-[-0.9px]">
            봉사자 명단 편집
          </h1>
        </div>
        <FloorTabs selected={floor} onSelect={setFloor} />
      </div>

      <div className="flex w-full items-center gap-2 xl:h-[49px]">
        <label className="flex h-11 min-w-0 flex-1 md:flex-none items-center gap-2 rounded-control border border-admin-border bg-admin-rowSurface px-3.5 md:w-[290px] md:px-4 transition-colors focus-within:border-admin-textMuted focus-within:bg-admin-surface motion-reduce:transition-none xl:h-[46px] xl:w-[420px] xl:gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- Figma 검색 아이콘 원본 SVG */}
          <img
            src="/icons/admin/search.svg"
            alt=""
            aria-hidden="true"
            width={16}
            height={16}
            className="size-4 shrink-0"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="봉사자 검색"
            placeholder="이름, 학번 또는 호실로 검색"
            className="min-w-0 flex-1 bg-transparent text-sm leading-[17px] text-admin-text placeholder:text-admin-textMuted focus:outline-none [@media(pointer:coarse)]:text-base [@media(pointer:coarse)]:leading-5"
          />
        </label>
        <button
          type="button"
          onClick={handleExport}
          disabled={status !== "ready" || exporting}
          aria-label="이력 엑셀 받기"
          aria-busy={exporting}
          className="ml-auto shrink-0 rounded-[10px] bg-admin-surface px-3 py-2 text-xs font-bold leading-[14px] text-admin-text shadow-[inset_0_0_0_1px_rgb(var(--admin-border))] transition-colors hover:bg-admin-rowSurface disabled:opacity-50 disabled:hover:bg-admin-surface md:text-[13px] md:leading-4 xl:px-3.5 xl:py-[9px]"
        >
          {exporting ? (
            "받는 중…"
          ) : (
            <>
              <span className="md:hidden">엑셀</span>
              <span className="hidden md:inline">이력 엑셀 받기</span>
            </>
          )}
        </button>
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col gap-2.5 overflow-y-auto [scrollbar-gutter:stable] md:gap-3.5 xl:gap-0 rounded-[16px] bg-admin-surface p-3.5 pt-4 md:rounded-[18px] md:p-5 xl:rounded-panel xl:p-[22px]">
        <p className="text-[11px] leading-[13px] text-admin-textSecondary md:text-xs md:leading-[14px] xl:hidden">
          전교생 {roster.length}명 · 당일 지정 {designatedCount}명
        </p>
        {status === "error" ? (
          <AdminContentState variant="error" onRetry={reload} />
        ) : status !== "ready" ? (
          <ListRowsSkeleton />
        ) : groups.length === 0 ? (
          <p className="py-6 text-center text-sm text-admin-textMuted">
            검색 결과가 없습니다.
          </p>
        ) : (
          <div
            className={`flex flex-col gap-4 md:gap-[18px] xl:gap-[22px] ${barVisible ? "xl:pb-20" : ""}`}
          >
            {groups.map((group) => (
              <section
                key={group.roomNumber}
                aria-label={`${group.roomNumber}호`}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-1.5 pl-0.5 xl:gap-2 xl:pl-1">
                  <h2 className="text-[13px] font-bold leading-4 text-admin-text md:text-sm md:leading-[17px] xl:text-[15px] xl:leading-[18px]">
                    {group.roomNumber}호
                  </h2>
                  <p className="font-mono text-[10px] leading-[13px] text-admin-textMuted md:text-[11px] md:leading-[15px] xl:text-xs xl:leading-4">
                    {group.students.length}명
                  </p>
                </div>
                {group.students.map((student) => (
                  <VolunteerRosterRow
                    key={student.studentId}
                    student={student}
                    onSelect={openStudent}
                    onDesignate={handleDesignate}
                  />
                ))}
              </section>
            ))}
          </div>
        )}
      </div>

      <VolunteerDesignatedBar count={barVisible ? designatedCount : 0} />
      {dialogStudent ? (
        <StudentDetailDialog
          key={dialogStudent.studentId}
          student={dialogStudent}
          onClose={() => setSelected(null)}
          onSave={handleSave}
          withConsecutive
        >
          <VolunteerHistory student={dialogStudent} />
        </StudentDetailDialog>
      ) : null}
    </div>
  );
}
