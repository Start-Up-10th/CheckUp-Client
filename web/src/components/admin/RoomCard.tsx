import { roomAttendance, type Room } from "@/lib/admin/mock-floor-data";

type RoomCardProps = {
  room: Room;
  onClick?: (room: Room) => void;
};

/** REQ-UI-001: 전원 출석은 라임 계열, 일부 미출석은 회색 계열로 구분한다. */
export function RoomCard({ room, onClick }: RoomCardProps) {
  const { assigned, present } = roomAttendance(room);
  const fullyPresent = present >= assigned;

  return (
    <button
      type="button"
      onClick={onClick ? () => onClick(room) : undefined}
      className={`flex aspect-[207.43/210] min-w-0 flex-col items-start justify-between overflow-hidden rounded-card border p-4 text-left xl:aspect-auto xl:h-full ${
        fullyPresent
          ? "border-admin-attendance-border bg-admin-attendance-bg"
          : "border-admin-absence-border bg-admin-absence-bg"
      }`}
    >
      <span
        className={`font-mono text-[17px] ${fullyPresent ? "text-admin-attendance-text" : "text-admin-textMuted"}`}
      >
        {room.number}
      </span>
      <span
        className={`text-xs ${fullyPresent ? "text-admin-attendance-textMuted" : "text-admin-textFaint"}`}
      >
        {present}/{assigned}명
      </span>
    </button>
  );
}
