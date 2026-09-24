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
        className="z-50 flex w-[310px] max-w-[calc(100vw-32px)] flex-col gap-1 rounded-[16px] bg-admin-surface p-4 md:w-[400px] md:p-[22px] xl:w-[460px]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id={`room-dialog-title-${room.number}`}
          className="text-[17px] font-bold leading-5 text-admin-text md:text-xl md:leading-[24px]"
        >
          {room.number}호
        </h2>
        <p className="text-[13px] leading-4 text-admin-textMuted md:text-sm md:leading-[17px]">
          {assigned}인실 · {present}명 출석
        </p>

        <div className="flex w-full flex-col gap-1.5 pt-3">
          {sortedRoomStudents(room).map((student, index) => (
            <div
              key={student.studentId}
              className="flex w-full items-center justify-between rounded-xl bg-admin-rowSurface py-2.5 pl-3.5 pr-2.5"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] text-admin-textFaint md:text-[13px]">
                  {index + 1}번
                </span>
                <span className="text-[13px] font-bold leading-4 text-admin-text md:text-sm md:leading-5">
                  {student.name}
                </span>
              </div>
              <span
                className={`flex h-6 w-[52px] items-center justify-center rounded-full text-[11px] font-bold md:h-7 md:w-16 md:text-xs ${
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
            className="rounded-[13px] bg-admin-ghost-bg px-[18px] py-[11px] text-[13px] font-bold leading-4 text-admin-ghost-text md:px-[22px] md:py-[13px] md:text-sm md:leading-5"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-[13px] bg-admin-accent-bg px-[18px] py-[11px] text-[13px] font-bold leading-4 text-admin-accent-text md:px-[22px] md:py-[13px] md:text-sm md:leading-5"
          >
            수정
          </button>
        </div>
      </div>
    </div>
  );
}
