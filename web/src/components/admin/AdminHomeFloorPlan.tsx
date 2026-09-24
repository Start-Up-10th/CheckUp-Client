"use client";

import { useMemo, useState } from "react";
import { FloorTabs } from "@/components/admin/FloorTabs";
import { AttendanceStatCards } from "@/components/admin/AttendanceStatCards";
import { RoomGrid } from "@/components/admin/RoomGrid";
import { RoomDetailDialog } from "@/components/admin/RoomDetailDialog";
import { ToastLayer, useToast } from "@/components/admin/Toast";
import { RoomAttendanceEditDialog } from "@/components/admin/RoomAttendanceEditDialog";
import { BellIcon } from "@/components/icons/AdminNavIcons";
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

export function AdminHomeFloorPlan() {
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
    <div className="flex min-h-full w-full flex-col gap-3.5 md:h-full md:min-h-0 px-4 py-3.5 md:gap-5 md:px-8 md:py-7">
      <ToastLayer toast={toast} />

      {/* 헤더: 폰=제목+탭, 패드+=제목+벨 */}
      <div className="flex w-full items-center justify-between md:items-end">
        <div className="flex flex-col gap-0.5 md:gap-1">
          <p className="font-mono text-[10px] leading-[13px] tracking-[1.6px] text-admin-textFaint md:text-[11px] md:leading-[15px] md:tracking-[1.98px]">
            <span className="md:hidden">ADMIN</span>
            <span className="hidden md:inline">FLOOR PLAN</span>
          </p>
          <h1 className="text-[22px] font-bold leading-[26px] tracking-[-0.44px] text-admin-text md:text-[30px] md:leading-[36px] md:tracking-[-0.9px]">
            {selectedFloor}층 전개도
          </h1>
        </div>
        {/* 폰: 탭이 헤더 우측 */}
        <FloorTabs
          selected={selectedFloor}
          onSelect={handleSelectFloor}
          className="md:hidden"
        />
        {/* 패드+: 알림 벨 (REQ-미구현 placeholder) */}
        <div className="relative hidden md:block">
          <BellIcon className="size-[22px] text-admin-textSecondary" />
          <span
            aria-hidden="true"
            className="absolute right-0 top-0 size-[7px] rounded-full bg-admin-danger-text"
          />
        </div>
      </div>

      {/* 탭+검색: 패드+ 전용 두 번째 행 */}
      <div className="hidden items-center gap-4 md:flex">
        <FloorTabs selected={selectedFloor} onSelect={handleSelectFloor} />
        <input
          type="text"
          placeholder="학번·이름 검색"
          disabled
          className="h-11 flex-1 rounded-control border border-admin-border bg-admin-rowSurface px-4 text-sm text-admin-text placeholder:text-admin-textMuted"
        />
      </div>

      <AttendanceStatCards present={present} absent={absent} />

      <RoomGrid rooms={rooms} onRoomClick={openRoomDetail} />

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
