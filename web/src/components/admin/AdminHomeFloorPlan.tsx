"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AdminContentState } from "@/components/admin/AdminContentState";
import { AdminFloorPlanSkeleton } from "@/components/admin/AdminFloorPlanSkeleton";
import { FloorTabs } from "@/components/admin/FloorTabs";
import { AttendanceStatCards } from "@/components/admin/AttendanceStatCards";
import { RoomGrid } from "@/components/admin/RoomGrid";
import { RoomDetailDialog } from "@/components/admin/RoomDetailDialog";
import { ToastLayer, useToast } from "@/components/admin/Toast";
import { RoomAttendanceEditDialog } from "@/components/admin/RoomAttendanceEditDialog";
import { redirectToAdminLogin } from "@/lib/admin/admin-session";
import {
  summarizeAttendance,
  type Floor,
  type Room,
  type RoomDetail,
  type Student,
} from "@/lib/admin/floor-types";
import { AdminUnauthorizedError } from "@/lib/admin/qr-api";
import { RateLimitedError, failureNotice } from "@/lib/rate-limit";
import { RoomApiError } from "@/lib/admin/room-api";
import { useRoomGateway } from "@/lib/admin/room-gateway";

const DEFAULT_FLOOR: Floor = 4;

const LOAD_FAILED_MESSAGE = "전개도를 불러오지 못했습니다.";
const ROOM_LOAD_FAILED_MESSAGE = "호실 명단을 불러오지 못했습니다.";
const SAVE_FAILED_MESSAGE = "전개도 변경에 실패했습니다. 다시 시도해 주세요.";

/** 호실 카드를 누르면 상세(읽기 전용) -> 수정(토글 편집) 2단계로 연다. */
type DialogStage = "view" | "edit";

/** 어떤 층·요청 차례(`attempt`)의 결과인지 함께 두어, 층을 바꾸거나 다시 시도했을 때 이전 결과를 쓰지 않는다. */
type FloorResult = { floor: Floor; attempt: number };
/** 조회 실패. `rateLimited`는 429(요청이 너무 많음) 때문인지다. */
type FloorFailure = FloorResult & { rateLimited: boolean };

/**
 * REQ-UI-001·002: 관리자 홈(전개도). 층 현황과 호실 명단은 서버(`RoomGateway`)에서 받는다. 호실 카드를 누르면 그 호실
 * 명단을 받아 상세 다이얼로그를 연다.
 */
export function AdminHomeFloorPlan() {
  const gateway = useRoomGateway();
  const [selectedFloor, setSelectedFloor] = useState<Floor>(DEFAULT_FLOOR);
  // 서버에서 받은 층 현황과 다시 시도 차례. 호실 저장 결과는 받아 둔 현황에 바로 반영한다.
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState<
    (FloorResult & { rooms: Room[] }) | null
  >(null);
  const [failed, setFailed] = useState<FloorFailure | null>(null);
  const [dialogRoom, setDialogRoom] = useState<RoomDetail | null>(null);
  const [dialogStage, setDialogStage] = useState<DialogStage>("view");
  // 호실 명단 요청이 겹칠 때 가장 최근 요청만 받아들이기 위한 번호.
  const roomRequest = useRef(0);
  // 저장 요청이 끝나기 전의 중복 저장을 막는다.
  const saving = useRef(false);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    gateway
      .floor(selectedFloor)
      .then((rooms) => {
        if (!cancelled) {
          setLoaded({ floor: selectedFloor, attempt, rooms });
        }
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof AdminUnauthorizedError) {
          redirectToAdminLogin();
          return;
        }
        setFailed({
          floor: selectedFloor,
          attempt,
          rateLimited: error instanceof RateLimitedError,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [gateway, selectedFloor, attempt]);

  const loadedNow =
    loaded?.floor === selectedFloor && loaded.attempt === attempt
      ? loaded
      : null;
  const loadFailed =
    failed?.floor === selectedFloor && failed.attempt === attempt;
  const isLoading = !loadedNow && !loadFailed;
  const rooms = useMemo(() => loadedNow?.rooms ?? [], [loadedNow]);
  const { present, absent } = useMemo(
    () => summarizeAttendance(rooms),
    [rooms],
  );

  useEffect(() => {
    if (loadFailed) {
      showToast(
        failureNotice(
          failed?.rateLimited ? new RateLimitedError() : null,
          LOAD_FAILED_MESSAGE,
        ),
      );
    }
  }, [loadFailed, failed, showToast]);

  if (isLoading) return <AdminFloorPlanSkeleton />;

  function handleSelectFloor(floor: Floor) {
    setSelectedFloor(floor);
    closeDialog();
  }

  function retryLoad() {
    setFailed(null);
    setAttempt((count) => count + 1);
  }

  async function openRoomDetail(room: Room) {
    const request = (roomRequest.current += 1);
    try {
      const students = await gateway.students(room.number);
      if (request !== roomRequest.current) return;
      setDialogRoom({ number: room.number, students });
      setDialogStage("view");
    } catch (error) {
      if (request !== roomRequest.current) return;
      if (error instanceof AdminUnauthorizedError) {
        redirectToAdminLogin();
        return;
      }
      showToast(failureNotice(error, ROOM_LOAD_FAILED_MESSAGE));
    }
  }

  function closeDialog() {
    roomRequest.current += 1;
    setDialogRoom(null);
    setDialogStage("view");
  }

  async function handleSaveRoom(roomNumber: string, students: Student[]) {
    if (!dialogRoom || saving.current) return;
    // 서버에는 출석 상태가 바뀐 학생만 보낸다.
    const changes = students
      .filter((student) => {
        const before = dialogRoom.students.find(
          (item) => item.studentId === student.studentId,
        );
        return before !== undefined && before.present !== student.present;
      })
      .map((student) => ({
        studentId: student.studentId,
        present: student.present,
      }));
    if (changes.length === 0) {
      closeDialog();
      showToast({ variant: "neutral", message: "변경된 내용이 없습니다." });
      return;
    }
    saving.current = true;
    try {
      await gateway.save(roomNumber, changes);
    } catch (error) {
      if (error instanceof AdminUnauthorizedError) {
        redirectToAdminLogin();
        return;
      }
      showToast(failureNotice(error, SAVE_FAILED_MESSAGE));
      // 서버의 호실 명단과 어긋났으면(호실 학생이 아님) 이 다이얼로그의 명단은 낡았으므로 닫고 현황을 다시 받는다.
      if (
        error instanceof RoomApiError &&
        error.code === "STUDENT_NOT_IN_ROOM"
      ) {
        closeDialog();
        retryLoad();
      }
      return;
    } finally {
      saving.current = false;
    }
    const presentCount = students.filter((student) => student.present).length;
    setLoaded((prev) =>
      prev
        ? {
            ...prev,
            rooms: prev.rooms.map((room) =>
              room.number === roomNumber
                ? { ...room, present: presentCount }
                : room,
            ),
          }
        : prev,
    );
    closeDialog();
    showToast({ variant: "success", message: "출석 상태를 저장했습니다." });
  }

  return (
    <div className="flex min-h-full w-full flex-col gap-3.5 md:h-full md:min-h-0 px-4 py-3.5 md:gap-4 md:px-[22px] md:py-6 xl:gap-5 xl:px-8 xl:py-7">
      <ToastLayer />

      {/* 헤더: 제목 좌측 + 층 탭 우측 */}
      <div className="flex w-full items-center justify-between md:h-[57px] xl:h-auto xl:items-end">
        <div className="flex flex-col gap-0.5 md:gap-[3px] xl:gap-1">
          <p className="font-mono text-[10px] leading-[13px] tracking-[1.6px] text-admin-textFaint md:tracking-[1.8px] xl:text-[11px] xl:leading-[15px] xl:tracking-[1.98px]">
            <span className="md:hidden">ADMIN</span>
            <span className="hidden md:inline">FLOOR PLAN</span>
          </p>
          <h1 className="text-[22px] font-bold leading-[26px] tracking-[-0.44px] text-admin-text md:text-[26px] md:leading-[31px] md:tracking-[-0.78px] xl:text-[30px] xl:leading-[36px] xl:tracking-[-0.9px]">
            {selectedFloor}층 전개도
          </h1>
        </div>
        <FloorTabs selected={selectedFloor} onSelect={handleSelectFloor} />
      </div>

      <AttendanceStatCards present={present} absent={absent} />

      {loadFailed || rooms.length === 0 ? (
        // 조회 실패는 다시 시도, 배정된 호실이 하나도 없는 층은 빈 상태(REQ-UI-006)를 본문 자리에 보인다.
        <div className="flex w-full flex-1 items-center justify-center rounded-[16px] bg-admin-surface px-3.5 py-4 md:rounded-[18px] md:p-[20px] xl:rounded-panel">
          {loadFailed ? (
            <AdminContentState variant="error" onRetry={retryLoad} />
          ) : (
            <AdminContentState variant="empty" />
          )}
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
