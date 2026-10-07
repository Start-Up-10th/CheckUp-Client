"use client";

import { ListRowsSkeleton } from "@/components/admin/ListRowsSkeleton";
import { useEffect, useMemo, useState } from "react";
import { AdminContentState } from "@/components/admin/AdminContentState";
import { StatusBanner } from "@/components/admin/StatusBanner";
import { ToastLayer, useToast } from "@/components/admin/Toast";
import { StudentDetailDialog } from "@/components/admin/student-management/StudentDetailDialog";
import { StudentFloorTabs } from "@/components/admin/student-management/StudentFloorTabs";
import { StudentRoomGroup } from "@/components/admin/student-management/StudentRoomGroup";
import { StudentSearchField } from "@/components/admin/student-management/StudentSearchField";
import type { Floor } from "@/lib/admin/floor-types";
import { useStudentManagementGateway } from "@/lib/admin/student-management-gateway";
import { failureToast, useSingleFlight } from "@/lib/admin/volunteer-action";
import { groupByRoom } from "@/lib/admin/volunteer-roster";
import { useVolunteerRoster } from "@/lib/admin/volunteer-roster-store";

const DEFAULT_FLOOR: Floor = 4;

/** Figma 08 학생 관리 state messages. */
const LIST_FAILURE_MESSAGE =
  "학생 명단을 불러오지 못했습니다. 다시 시도해 주세요.";
const NO_RESULT_MESSAGE = "검색 결과가 없습니다.";
const COUNT_SUCCESS_MESSAGE = "봉사 횟수를 변경했습니다.";
const COUNT_FAILURE_MESSAGE =
  "봉사 횟수 변경에 실패했습니다. 다시 시도해 주세요.";

/**
 * 학생 관리(Figma 08). 전체 학생을 층 탭·검색으로 거르고 호실별로 보여 준다. 학생을 누르면 상세 다이얼로그에서
 * 봉사 횟수와 사유를 정해 저장한다. 저장은 서버 `PATCH /api/v1/volunteer/{id}/count`로 횟수 변화와 사유를 한 번에 보낸다
 * (`apiStudentManagementGateway`).
 */
export function AdminStudentManagement() {
  const { roster, status, updateStudent, reload } = useVolunteerRoster();
  const [floor, setFloor] = useState<Floor>(DEFAULT_FLOOR);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const gateway = useStudentManagementGateway();
  const singleFlight = useSingleFlight();
  const { toasts, showToast } = useToast();

  const groups = useMemo(
    () => groupByRoom(roster, { floor, query }),
    [roster, floor, query],
  );
  const selected =
    roster.find((student) => student.studentId === selectedId) ?? null;

  useEffect(() => {
    if (status === "error") {
      showToast({ variant: "error", message: LIST_FAILURE_MESSAGE });
    }
  }, [status, showToast]);

  function handleSave(change: { count: number; reason: string }) {
    if (!selected) return;
    if (change.count === selected.count) {
      setSelectedId(null);
      return;
    }
    return singleFlight(selected.id, async () => {
      try {
        const updated = await gateway.saveCount(selected, change);
        updateStudent(updated);
        setSelectedId(null);
        showToast({ variant: "success", message: COUNT_SUCCESS_MESSAGE });
      } catch (error) {
        const failure = failureToast(error, COUNT_FAILURE_MESSAGE, reload);
        if (failure) showToast(failure);
      }
    });
  }

  return (
    <div className="flex h-full w-full flex-col gap-3.5 px-4 py-3.5 md:gap-4 md:px-[22px] md:py-6 xl:gap-5 xl:px-8 xl:py-7">
      <ToastLayer toasts={toasts} />

      <div className="flex w-full items-end justify-between">
        <div className="flex flex-col gap-0.5 md:gap-[3px] xl:gap-1">
          <p className="font-mono text-[10px] leading-[13px] tracking-[1.6px] text-admin-textFaint md:tracking-[1.8px] xl:text-[11px] xl:leading-[15px] xl:tracking-[1.98px]">
            <span className="md:hidden">ADMIN</span>
            <span className="hidden md:inline">STUDENTS</span>
          </p>
          <h1 className="text-[22px] font-bold leading-[26px] tracking-[-0.44px] text-admin-text md:text-[26px] md:leading-[31px] md:tracking-[-0.78px] xl:text-[30px] xl:leading-[36px] xl:tracking-[-0.9px]">
            학생 관리
          </h1>
        </div>
        <StudentFloorTabs selected={floor} onSelect={setFloor} />
      </div>

      <StudentSearchField value={query} onChange={setQuery} />

      <div className="flex min-h-0 w-full flex-1 flex-col gap-2.5 overflow-y-auto rounded-2xl bg-admin-surface p-3.5 pt-4 md:gap-3.5 md:rounded-[18px] md:p-5 xl:gap-0 xl:rounded-panel xl:p-[22px]">
        <p className="text-[11px] leading-[13px] text-admin-textSecondary md:text-xs md:leading-[14px] xl:hidden">
          전교생 {roster.length}명
        </p>
        {status === "error" ? (
          <AdminContentState variant="error" onRetry={reload} />
        ) : status !== "ready" ? (
          <ListRowsSkeleton />
        ) : groups.length === 0 ? (
          <StatusBanner variant="neutral" message={NO_RESULT_MESSAGE} />
        ) : (
          <div className="flex flex-col gap-4 md:gap-[18px] xl:gap-[22px]">
            {groups.map((group) => (
              <StudentRoomGroup
                key={group.roomNumber}
                group={group}
                onSelect={setSelectedId}
              />
            ))}
          </div>
        )}
      </div>

      {selected ? (
        <StudentDetailDialog
          key={selected.studentId}
          student={selected}
          onClose={() => setSelectedId(null)}
          onSave={handleSave}
        />
      ) : null}
    </div>
  );
}
