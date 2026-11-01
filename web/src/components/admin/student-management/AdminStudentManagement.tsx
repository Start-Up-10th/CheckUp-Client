"use client";

import { ListRowsSkeleton } from "@/components/admin/ListRowsSkeleton";
import { useEffect, useMemo, useState } from "react";
import { AdminContentState } from "@/components/admin/AdminContentState";
import { ToastLayer, useToast } from "@/components/admin/Toast";
import {
  StudentDetailDialog,
  type StudentDialogValue,
} from "@/components/admin/student-management/StudentDetailDialog";
import { StudentFloorTabs } from "@/components/admin/student-management/StudentFloorTabs";
import { StudentRoomGroup } from "@/components/admin/student-management/StudentRoomGroup";
import { StudentSearchField } from "@/components/admin/student-management/StudentSearchField";
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
import { groupByRoom } from "@/lib/admin/volunteer-roster";
import { useVolunteerRoster } from "@/lib/admin/volunteer-roster-store";
import type { RosterStudent } from "@/lib/admin/volunteer-types";

const DEFAULT_FLOOR: Floor = 3;

/** Figma 08 학생 관리 state messages. */
const LIST_FAILURE_MESSAGE =
  "학생 명단을 불러오지 못했습니다. 다시 시도해 주세요.";
const NO_RESULT_MESSAGE = "검색 결과가 없습니다.";
const COUNT_SUCCESS_MESSAGE = "봉사 횟수를 변경했습니다.";
const COUNT_FAILURE_MESSAGE =
  "봉사 횟수 변경에 실패했습니다. 다시 시도해 주세요.";
const CONSECUTIVE_SUCCESS_MESSAGE = "연속 봉사 횟수를 변경했습니다.";
const CONSECUTIVE_FAILURE_MESSAGE =
  "연속 봉사 횟수 변경에 실패했습니다. 다시 시도해 주세요.";

/**
 * 학생 관리(Figma 08). 전체 학생을 층 탭·검색으로 거르고 호실별로 보여 준다. 학생을 누르면 상세 다이얼로그에서
 * 봉사 횟수·연속 봉사 횟수와 사유를 정해 저장한다. 저장은 서버의 지금 횟수에서 변화를 계산해 일반은
 * `PATCH /api/v1/volunteer/{id}/count`, 연속은 `PATCH /consecutive/count`로 따로 보낸다(`apiStudentManagementGateway`).
 * 다이얼로그를 연 때와 달라진 칸만, 관리자가 바꾼 만큼 보낸다. 일부만 반영되고 실패하면 반영된 값을 기준으로 삼아
 * 다시 저장해도 같은 변화를 두 번 보내지 않는다.
 */
export function AdminStudentManagement() {
  const { roster, status, rateLimited, updateStudent, reload } =
    useVolunteerRoster();
  const [floor, setFloor] = useState<Floor>(DEFAULT_FLOOR);
  const [query, setQuery] = useState("");
  // 다이얼로그를 연 때의 학생 상태. 저장은 이 값에서 바꾼 만큼만 보내 그사이 다른 곳의 변경(`완료` 등)을 지우지
  // 않는다. 명단을 다시 받아도 바꾸지 않고, 일부만 저장되고 실패하면 반영된 만큼 옮긴다.
  const [selected, setSelected] = useState<RosterStudent | null>(null);
  const gateway = useStudentManagementGateway();
  const singleFlight = useSingleFlight();
  const { showToast } = useToast();

  const groups = useMemo(
    () => groupByRoom(roster, { floor, query }),
    [roster, floor, query],
  );

  function openStudent(studentId: string) {
    setSelected(
      roster.find((student) => student.studentId === studentId) ?? null,
    );
  }

  // 다시 받은 명단에 학생이 없으면(삭제 등) 다이얼로그를 보이지 않는다.
  const dialogStudent =
    selected &&
    (status !== "ready" || roster.some((student) => student.id === selected.id))
      ? selected
      : null;

  useEffect(() => {
    if (status === "error") {
      showToast(listFailureToast(rateLimited, LIST_FAILURE_MESSAGE));
    }
  }, [status, rateLimited, showToast]);

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
        const updated = await gateway.saveCount(selected, change);
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

  return (
    <div className="flex h-full w-full flex-col gap-3.5 px-4 py-3.5 md:gap-4 md:px-[22px] md:py-6 xl:gap-5 xl:px-8 xl:py-7">
      <ToastLayer />

      <div className="flex w-full items-end justify-between">
        <div className="flex flex-col gap-0.5 md:gap-[3px] xl:gap-1">
          <h1 className="text-[22px] font-bold leading-[26px] tracking-[-0.44px] text-admin-text md:text-[26px] md:leading-[31px] md:tracking-[-0.78px] xl:text-[30px] xl:leading-[36px] xl:tracking-[-0.9px]">
            학생 관리
          </h1>
        </div>
        <StudentFloorTabs selected={floor} onSelect={setFloor} />
      </div>

      <StudentSearchField value={query} onChange={setQuery} />

      <div className="flex min-h-0 w-full flex-1 flex-col gap-2.5 overflow-y-auto [scrollbar-gutter:stable] rounded-2xl bg-admin-surface p-3.5 pt-4 md:gap-3.5 md:rounded-[18px] md:p-5 xl:gap-0 xl:rounded-panel xl:p-[22px]">
        <p className="text-[11px] leading-[13px] text-admin-textSecondary md:text-xs md:leading-[14px] xl:hidden">
          전교생 {roster.length}명
        </p>
        {status === "error" ? (
          <AdminContentState variant="error" onRetry={reload} />
        ) : status !== "ready" ? (
          <ListRowsSkeleton />
        ) : groups.length === 0 ? (
          <AdminContentState variant="empty" description={NO_RESULT_MESSAGE} />
        ) : (
          <div className="flex flex-col gap-4 md:gap-[18px] xl:gap-[22px]">
            {groups.map((group) => (
              <StudentRoomGroup
                key={group.roomNumber}
                group={group}
                onSelect={openStudent}
              />
            ))}
          </div>
        )}
      </div>

      {dialogStudent ? (
        <StudentDetailDialog
          key={dialogStudent.studentId}
          student={dialogStudent}
          onClose={() => setSelected(null)}
          onSave={handleSave}
          withConsecutive
        />
      ) : null}
    </div>
  );
}
