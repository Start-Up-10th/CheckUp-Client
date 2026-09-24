import { roomAttendance, type Room } from "@/lib/admin/mock-floor-data";

type RoomCardProps = {
  room: Room;
  onClick?: (room: Room) => void;
};

/**
 * REQ-UI-001: 전원 출석은 라임 계열, 일부 미출석은 회색 계열로 구분한다.
 * 폰(Figma 관리자-핸드폰)은 호실 번호만 가운데에 표시하고, 패드·컴퓨터는 호실 번호와 출석 인원을 함께 보여준다.
 */
export function RoomCard({ room, onClick }: RoomCardProps) {
  const { assigned, present } = roomAttendance(room);
  const fullyPresent = present >= assigned;

  return (
    <button
      type="button"
      onClick={onClick ? () => onClick(room) : undefined}
      className={`flex min-w-0 flex-col items-center justify-center overflow-hidden rounded-[10px] border py-2.5 text-center md:items-start md:justify-between md:rounded-[12px] md:p-3 md:text-left xl:aspect-auto xl:h-full xl:rounded-card xl:p-4 ${
        fullyPresent
          ? "border-admin-attendance-border bg-admin-attendance-bg"
          : "border-admin-absence-border bg-admin-absence-bg"
      }`}
    >
      <span
        className={`font-mono text-[13px] md:text-[14px] xl:text-[17px] ${fullyPresent ? "text-admin-attendance-text" : "text-admin-textMuted"}`}
      >
        {room.number}
      </span>
      <span
        className={`hidden text-[10px] md:block xl:text-xs ${fullyPresent ? "text-admin-attendance-textMuted" : "text-admin-textFaint"}`}
      >
        {present}/{assigned}명
      </span>
    </button>
  );
}
