"use client";

import { useMemo, useState } from "react";
import { AdminContentState } from "@/components/admin/AdminContentState";
import { AdminFloorPlanSkeleton } from "@/components/admin/AdminFloorPlanSkeleton";
import { FloorTabs } from "@/components/admin/FloorTabs";
import { AttendanceStatCards } from "@/components/admin/AttendanceStatCards";
import { RoomGrid } from "@/components/admin/RoomGrid";
import { RoomDetailDialog } from "@/components/admin/RoomDetailDialog";
import { ToastLayer, useToast } from "@/components/admin/Toast";
import { RoomAttendanceEditDialog } from "@/components/admin/RoomAttendanceEditDialog";
import {
  MOCK_FLOOR_ROOMS,
  summarizeAttendance,
  type Floor,
  type Room,
  type Student,
} from "@/lib/admin/mock-floor-data";

const DEFAULT_FLOOR: Floor = 4;

/** 호실 카드를 누르면 상세(읽기 전용) -> 수정(토글 편집) 2단계로 연다. */
type DialogStage = "view" | "edit";

export function AdminHomeFloorPlan({
  isLoading = false,
  loadFailed = false,
}: {
  /** 전개도 데이터 로딩 중. 실제 조회 연결 전까지 기본은 false다. */
  isLoading?: boolean;
  /** 전개도 조회 실패. 실제 조회 연결 전까지 기본은 false다. */
  loadFailed?: boolean;
}) {
  const [selectedFloor, setSelectedFloor] = useState<Floor>(DEFAULT_FLOOR);
  const [roomsByFloor, setRoomsByFloor] = useState(MOCK_FLOOR_ROOMS);
  const [dialogRoomNumber, setDialogRoomNumber] = useState<string | null>(null);
  const [dialogStage, setDialogStage] = useState<DialogStage>("view");
  const { toast, showToast } = useToast();

  const rooms = roomsByFloor[selectedFloor];
  const { present, absent } = useMemo(
    () => summarizeAttendance(rooms),
    [rooms],
  );

  if (isLoading) return <AdminFloorPlanSkeleton />;
  const dialogRoom =
    rooms.find((room) => room.number === dialogRoomNumber) ?? null;

  function handleSelectFloor(floor: Floor) {
    setSelectedFloor(floor);
    closeDialog();
  }

  function openRoomDetail(room: Room) {
    setDialogRoomNumber(room.number);
    setDialogStage("view");
  }

  function closeDialog() {
    setDialogRoomNumber(null);
    setDialogStage("view");
  }

  function handleSaveRoom(roomNumber: string, students: Student[]) {
    const current = rooms.find((room) => room.number === roomNumber);
    const unchanged = current?.students.every(
      (student, index) => student.present === students[index]?.present,
    );
    if (unchanged) {
      closeDialog();
      showToast({ variant: "neutral", message: "변경된 내용이 없습니다." });
      return;
    }
    setRoomsByFloor((prev) => ({
      ...prev,
      [selectedFloor]: prev[selectedFloor].map((room): Room =>
        room.number === roomNumber ? { ...room, students } : room,
      ),
    }));
    closeDialog();
    showToast({ variant: "success", message: "출석 상태를 저장했습니다." });
  }

  return (
    <div className="flex min-h-full w-full flex-col gap-3.5 md:h-full md:min-h-0 px-4 py-3.5 md:gap-4 md:px-[22px] md:py-6">
      <ToastLayer toast={toast} />

      {/* 헤더: 제목 좌측 + 층 탭 우측 */}
      <div className="flex w-full items-center justify-between md:items-end">
        <div className="flex flex-col gap-0.5 md:gap-1">
          <p className="font-mono text-[10px] leading-[13px] tracking-[1.6px] text-admin-textFaint md:tracking-[1.8px] xl:text-[11px] xl:leading-[15px] xl:tracking-[1.98px]">
            <span className="md:hidden">ADMIN</span>
            <span className="hidden md:inline">FLOOR PLAN</span>
          </p>
          <h1 className="text-[22px] font-bold leading-[26px] tracking-[-0.44px] text-admin-text md:text-[26px] md:leading-normal md:tracking-[-0.78px] xl:text-[30px] xl:leading-[36px] xl:tracking-[-0.9px]">
            {selectedFloor}층 전개도
          </h1>
        </div>
        <FloorTabs selected={selectedFloor} onSelect={handleSelectFloor} />
      </div>

      <AttendanceStatCards present={present} absent={absent} />

      {loadFailed ? (
        <div className="flex w-full flex-1 items-center justify-center rounded-[16px] bg-admin-surface px-3.5 py-4 md:rounded-[18px] md:p-[20px] xl:rounded-panel">
          <AdminContentState variant="error" onRetry={() => {}} />
        </div>
      ) : (
        <RoomGrid rooms={rooms} onRoomClick={openRoomDetail} />
      )}

      {dialogRoom && dialogStage === "view" && (
        <RoomDetailDialog
          key={dialogRoom.number}
          room={dialogRoom}
          onClose={closeDialog}
          onEdit={() => setDialogStage("edit")}
        />
      )}

      {dialogRoom && dialogStage === "edit" && (
        <RoomAttendanceEditDialog
          key={dialogRoom.number}
          room={dialogRoom}
          onClose={closeDialog}
          onSave={handleSaveRoom}
        />
      )}
    </div>
  );
}
