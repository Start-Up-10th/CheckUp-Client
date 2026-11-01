"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AdminContentState } from "@/components/admin/AdminContentState";
import {
  AdminFloorPlanSkeleton,
  RoomGridSkeleton,
} from "@/components/admin/AdminFloorPlanSkeleton";
import { FloorTabs } from "@/components/admin/FloorTabs";
import { AttendanceStatCards } from "@/components/admin/AttendanceStatCards";
import { RoomGrid } from "@/components/admin/RoomGrid";
import { DutyCalendar } from "@/components/admin/DutyCalendar";
import { RoomDetailDialog } from "@/components/admin/RoomDetailDialog";
import { ToastLayer, useToast } from "@/components/admin/Toast";
import { RoomAttendanceEditDialog } from "@/components/admin/RoomAttendanceEditDialog";
import { operatingDayKey } from "@/lib/admin/operating-day";
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

const DEFAULT_FLOOR: Floor = 3;

/** 새 층 현황이 이 시간 안에 오면 이전 화면을 그대로 두고, 더 걸릴 때만 격자를 스켈레톤으로 바꿔 깜빡임을 없앤다. */
const SKELETON_DELAY_MS = 300;

/** 홈이 열려 있는 동안 현재 층 현황을 다시 받는 주기(DEC-103). 탭이 숨겨진 동안은 받지 않는다. */
const FLOOR_REFRESH_MS = 30_000;

const LOAD_FAILED_MESSAGE = "전개도를 불러오지 못했습니다.";
const ROOM_LOAD_FAILED_MESSAGE = "호실 명단을 불러오지 못했습니다.";
const SAVE_FAILED_MESSAGE = "전개도 변경에 실패했습니다. 다시 시도해 주세요.";

/** 호실 카드를 누르면 상세(읽기 전용) -> 수정(토글 편집) 2단계로 연다. */
type DialogStage = "view" | "edit";

/** 어떤 층·요청 차례(`attempt`)의 실패인지 함께 두어, 층을 바꾸거나 다시 시도했을 때 이전 실패를 쓰지 않는다. */
/** 조회 실패. `rateLimited`는 429(요청이 너무 많음) 때문인지다. */
type FloorFailure = {
  floor: Floor;
  date: string;
  attempt: number;
  rateLimited: boolean;
};

/** 층 현황 캐시의 키. 날짜마다 따로 둔다. */
const cacheKey = (date: string, floor: Floor) => `${date}:${floor}`;

/** 새 현황을 넣으면서 지금 보는 날과 오늘 것만 남겨, 본 날짜가 계속 쌓이지 않게 한다. */
function putRooms(
  prev: Partial<Record<string, Room[]>>,
  date: string,
  today: string,
  floor: Floor,
  rooms: Room[],
) {
  const next: Partial<Record<string, Room[]>> = {};
  for (const [key, value] of Object.entries(prev)) {
    if (key.startsWith(`${date}:`) || key.startsWith(`${today}:`))
      next[key] = value;
  }
  next[cacheKey(date, floor)] = rooms;
  return next;
}

/**
 * REQ-UI-001·002: 관리자 홈(전개도). 층 현황과 호실 명단은 서버(`RoomGateway`)에서 받는다. 호실 카드를 누르면 그 호실
 * 명단을 받아 상세 다이얼로그를 연다.
 */
export function AdminHomeFloorPlan() {
  const gateway = useRoomGateway();
  const [selectedFloor, setSelectedFloor] = useState<Floor>(DEFAULT_FLOOR);
  // 서버에서 받은 층 현황과 다시 시도 차례. 호실 저장 결과는 받아 둔 현황에 바로 반영한다.
  const [attempt, setAttempt] = useState(0);
  // 층마다 마지막으로 받은 현황. 이미 본 층은 바로 보여 주고 뒤에서 다시 받아 갱신한다. 호실 저장 결과는 여기에 바로 반영한다.
  const [byFloor, setByFloor] = useState<Partial<Record<string, Room[]>>>({});
  // 보는 날 `YYYY-MM-DD`. 처음에는 오늘 운영일이고, 지난 날짜는 조회만 한다(수정은 오늘만).
  const todayKey = operatingDayKey(new Date());
  // 고른 지난 날짜. 없으면 오늘 운영일을 따라가, 화면을 연 채 08:00을 넘기면 새 운영일로 바뀐다.
  const [picked, setPicked] = useState<string | null>(null);
  const date = picked ?? todayKey;
  const viewingPast = date !== todayKey;
  // 오늘은 날짜 없이 요청해 기존 동작을 그대로 둔다. 층 현황 캐시는 날짜별로 나눈다.
  const queryDate = viewingPast ? date : undefined;
  // 지금 화면에 그려진 층·날짜. 새 현황이 오기 전에는 이전 것을 그대로 두고, 오면 제목·합계·격자를 한 번에 바꾼다.
  const [shown, setShown] = useState<{ floor: Floor; date: string } | null>(
    null,
  );
  // 새 현황이 `SKELETON_DELAY_MS`를 넘겨도 오지 않아 격자를 스켈레톤으로 바꿔야 하는 날짜·층의 캐시 키.
  const [slowKey, setSlowKey] = useState<string | null>(null);
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
    const slowTimer = setTimeout(() => {
      if (!cancelled) setSlowKey(cacheKey(date, selectedFloor));
    }, SKELETON_DELAY_MS);
    gateway
      .floor(selectedFloor, queryDate)
      .then((rooms) => {
        if (cancelled) return;
        setByFloor((prev) =>
          putRooms(prev, date, todayKey, selectedFloor, rooms),
        );
        setShown({ floor: selectedFloor, date });
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof AdminUnauthorizedError) {
          redirectToAdminLogin();
          return;
        }
        setFailed({
          floor: selectedFloor,
          date,
          attempt,
          rateLimited: error instanceof RateLimitedError,
        });
      })
      .finally(() => clearTimeout(slowTimer));
    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
    };
  }, [gateway, selectedFloor, attempt, date, todayKey, queryDate]);

  // 점호 중 다른 곳(얼굴 인식 등)에서 바뀐 출석을 반영한다. 화면은 그대로 두고 값만 바꾸며, 실패는 조용히 넘겨 다음 주기에 다시 받는다.
  // 호실 다이얼로그는 따로 받은 `dialogRoom`을 보이므로 뒤 화면이 바뀌어도 내용이 바뀌지 않는다.
  useEffect(() => {
    // 지난 날짜는 더 바뀌지 않으므로 다시 받지 않는다.
    if (viewingPast) return;
    let cancelled = false;
    function refresh() {
      if (document.visibilityState !== "visible") return;
      gateway
        .floor(selectedFloor)
        .then((rooms) => {
          if (!cancelled)
            setByFloor((prev) => ({
              ...prev,
              [cacheKey(date, selectedFloor)]: rooms,
            }));
        })
        .catch((error) => {
          if (!cancelled && error instanceof AdminUnauthorizedError)
            redirectToAdminLogin();
        });
    }
    const timer = setInterval(refresh, FLOOR_REFRESH_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [gateway, selectedFloor, viewingPast, date]);

  const selectedRooms = byFloor[cacheKey(date, selectedFloor)];
  const loadFailed =
    failed?.floor === selectedFloor &&
    failed.date === date &&
    failed.attempt === attempt;
  // 받은 적 있는 층은 다시 받는 동안 이전 값을 그대로 보인다. 실패해도 이전 값을 두고 안내만 띄운다.
  const displayFloor: Floor | null = selectedRooms
    ? selectedFloor
    : (shown?.floor ?? null);
  const displayDate = selectedRooms ? date : (shown?.date ?? date);
  const rooms = useMemo(
    () =>
      displayFloor ? (byFloor[cacheKey(displayDate, displayFloor)] ?? []) : [],
    [byFloor, displayFloor, displayDate],
  );
  // 이미 받은 층이 하나도 없을 때만 전체 스켈레톤이다. 그 뒤에 오래 걸리는 층은 격자만 스켈레톤으로 바꾼다.
  const showError = loadFailed && !selectedRooms;
  const gridLoading =
    !selectedRooms && !loadFailed && slowKey === cacheKey(date, selectedFloor);
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

  if (displayFloor === null && !loadFailed) return <AdminFloorPlanSkeleton />;

  function handleSelectFloor(floor: Floor) {
    setSelectedFloor(floor);
    closeDialog();
  }

  function handleSelectDate(next: string) {
    setPicked(next === todayKey ? null : next);
    closeDialog();
  }

  function retryLoad() {
    setFailed(null);
    setAttempt((count) => count + 1);
  }

  async function openRoomDetail(room: Room) {
    const request = (roomRequest.current += 1);
    // 층 명단으로 받은 학생이 있으면 다시 요청하지 않고, 누른 카드와 같은 날짜·내용으로 바로 연다.
    if (room.students) {
      setDialogRoom({ number: room.number, students: room.students });
      setDialogStage("view");
      return;
    }
    try {
      const students = await gateway.students(room.number, queryDate);
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
    // 저장하는 사이 날짜가 바뀌어도 저장을 시작한 날·층의 캐시에만 반영한다.
    const savedKey = displayFloor && cacheKey(displayDate, displayFloor);
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
    setByFloor((prev) => {
      if (!savedKey) return prev;
      const floorRooms = prev[savedKey];
      if (!floorRooms) return prev;
      return {
        ...prev,
        [savedKey]: floorRooms.map((room) =>
          room.number === roomNumber
            ? {
                ...room,
                present: presentCount,
                // 카드 이름의 출석 표시도 저장한 상태로 바꾼다.
                students: room.students?.map((student) => ({
                  ...student,
                  present:
                    students.find(
                      (item) => item.studentId === student.studentId,
                    )?.present ?? student.present,
                })),
              }
            : room,
        ),
      };
    });
    closeDialog();
    showToast({ variant: "success", message: "출석 상태를 저장했습니다." });
  }

  return (
    <div className="flex min-h-full w-full flex-col gap-3.5 md:h-full md:min-h-0 px-4 py-3.5 md:gap-4 md:px-[22px] md:py-6 xl:gap-5 xl:px-8 xl:py-7">
      <ToastLayer />

      {/* 헤더: 제목 좌측 + 층 탭 우측 */}
      <div className="flex w-full items-center justify-between md:h-[57px] xl:h-auto xl:items-end">
        <div className="flex flex-col gap-0.5 md:gap-[3px] xl:gap-1">
          <h1 className="text-[22px] font-bold leading-[26px] tracking-[-0.44px] text-admin-text md:text-[26px] md:leading-[31px] md:tracking-[-0.78px] xl:text-[30px] xl:leading-[36px] xl:tracking-[-0.9px]">
            {displayFloor ?? selectedFloor}층 전개도
          </h1>
        </div>
        <FloorTabs selected={selectedFloor} onSelect={handleSelectFloor} />
      </div>

      <AttendanceStatCards
        present={gridLoading ? "–" : present}
        absent={gridLoading ? "–" : absent}
      />

      {gridLoading ? (
        <RoomGridSkeleton />
      ) : showError || rooms.length === 0 ? (
        // 조회 실패는 다시 시도, 배정된 호실이 하나도 없는 층은 빈 상태(REQ-UI-006)를 본문 자리에 보인다.
        <div className="flex w-full flex-1 items-center justify-center rounded-[16px] bg-admin-surface px-3.5 py-4 md:rounded-[18px] md:p-[20px] xl:rounded-panel">
          {showError ? (
            <AdminContentState variant="error" onRetry={retryLoad} />
          ) : (
            <AdminContentState variant="empty" />
          )}
        </div>
      ) : (
        <RoomGrid
          rooms={rooms}
          // 고른 날짜·층이 아직 오지 않아(받는 중·실패) 이전 화면이 남아 있으면 누를 수 없다. 이전 날짜 명단에 오늘의 `수정`이
          // 붙거나 저장 결과가 다른 날짜 화면에 들어가는 것을 막는다.
          onRoomClick={selectedRooms ? openRoomDetail : undefined}
          busy={!selectedRooms && !loadFailed}
          action={
            <DutyCalendar
              todayKey={todayKey}
              selectedKey={date}
              onSelect={handleSelectDate}
              closeOnSelect
            />
          }
        />
      )}

      {dialogRoom && dialogStage === "view" && (
        <RoomDetailDialog
          key={dialogRoom.number}
          room={dialogRoom}
          onClose={closeDialog}
          onEdit={viewingPast ? undefined : () => setDialogStage("edit")}
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
