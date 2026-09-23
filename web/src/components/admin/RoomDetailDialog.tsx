import {
  roomAttendance,
  sortedRoomStudents,
  type Room,
} from "@/lib/admin/mock-floor-data";

type RoomDetailDialogProps = {
  room: Room;
  onClose: () => void;
  onEdit: () => void;
};

/**
 * REQ-UI-002: 호실 상세는 읽기 전용이다. "수정"을 눌러야 편집 다이얼로그(RoomAttendanceEditDialog)로 넘어간다.
 * Figma node 540:1003. 스타일 가이드(523:5) 기준: 딤 45%, 라운드 16, 컴퓨터 폭 460px.
 */
export function RoomDetailDialog({
  room,
  onClose,
  onEdit,
}: RoomDetailDialogProps) {
  const { assigned, present } = roomAttendance(room);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#1c1c1e]/45"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`room-dialog-title-${room.number}`}
        className="z-50 flex w-[310px] max-w-[calc(100vw-32px)] flex-col gap-1 rounded-[16px] bg-admin-surface p-[22px] md:w-[400px] xl:w-[460px]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id={`room-dialog-title-${room.number}`}
          className="text-xl font-bold leading-[24px] text-admin-text"
        >
          {room.number}호
        </h2>
        <p className="text-sm leading-[17px] text-admin-textMuted">
          {assigned}인실 · {present}명 출석
        </p>

        <div className="flex w-full flex-col gap-1.5 pt-3">
          {sortedRoomStudents(room).map((student, index) => (
            <div
              key={student.studentId}
              className="flex w-full items-center justify-between rounded-xl bg-admin-rowSurface py-2.5 pl-3.5 pr-2.5"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[13px] text-admin-textFaint">
                  {index + 1}번
                </span>
                <span className="text-sm font-bold text-admin-text">
                  {student.name}
                </span>
              </div>
              <span
                className={`flex h-7 w-16 items-center justify-center rounded-full text-xs font-bold ${
                  student.present
                    ? "bg-admin-attendance-bg text-admin-attendance-text"
                    : "bg-admin-absence-bg text-admin-textMuted"
                }`}
              >
                {student.present ? "출석" : "미출석"}
              </span>
            </div>
          ))}
        </div>

        <div className="flex h-[100px] w-full items-start justify-end gap-2 pt-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[13px] bg-admin-ghost-bg px-[22px] py-[13px] text-sm font-bold text-admin-ghost-text"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-[13px] bg-admin-accent-bg px-[22px] py-[13px] text-sm font-bold text-admin-accent-text"
          >
            수정
          </button>
        </div>
      </div>
    </div>
  );
}
