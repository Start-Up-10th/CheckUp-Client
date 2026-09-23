"use client";

import { useMemo, useState } from "react";
import { FloorTabs } from "@/components/admin/FloorTabs";
import { AttendanceStatCards } from "@/components/admin/AttendanceStatCards";
import { RoomGrid } from "@/components/admin/RoomGrid";
import { RoomDetailDialog } from "@/components/admin/RoomDetailDialog";
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

export function AdminHomeFloorPlan() {
  const [selectedFloor, setSelectedFloor] = useState<Floor>(DEFAULT_FLOOR);
  const [roomsByFloor, setRoomsByFloor] = useState(MOCK_FLOOR_ROOMS);
  const [dialogRoomNumber, setDialogRoomNumber] = useState<string | null>(null);
  const [dialogStage, setDialogStage] = useState<DialogStage>("view");

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
    setRoomsByFloor((prev) => ({
      ...prev,
      [selectedFloor]: prev[selectedFloor].map((room): Room =>
        room.number === roomNumber ? { ...room, students } : room,
      ),
    }));
    closeDialog();
  }

  return (
    <div className="flex h-full w-full min-h-0 flex-col gap-3.5 px-4 py-3.5 md:gap-5 md:px-8 md:py-7">
      <div className="flex w-full items-end justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-[11px] leading-[15px] tracking-[1.98px] text-admin-textFaint">
            FLOOR PLAN
          </p>
          <h1 className="text-[30px] font-bold leading-[36px] tracking-[-0.9px] text-admin-text">
            {selectedFloor}층 전개도
          </h1>
        </div>
        <FloorTabs selected={selectedFloor} onSelect={handleSelectFloor} />
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
