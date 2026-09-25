import type { Room } from "@/lib/admin/mock-floor-data";
import {
  roomCardCountLabel,
  roomCardStatus,
  type RoomCardStatus,
} from "./room-card-status";

const STATUS_STYLES: Record<
  RoomCardStatus,
  { card: string; number: string; count: string }
> = {
  present: {
    card: "border-admin-attendance-border bg-admin-attendance-bg",
    number: "text-admin-attendance-text",
    count: "text-admin-attendance-textMuted",
  },
  absent: {
    card: "border-admin-absence-border bg-admin-absence-bg",
    number: "text-admin-textMuted",
    count: "text-admin-textFaint",
  },
};

type RoomCardProps = {
  room: Room;
  onClick?: (room: Room) => void;
};

/**
 * REQ-UI-001 호실 카드 표기 규칙: 좌상단 호실 번호, 좌하단 `출석/배정 인원명`.
 * 전원 출석은 라임 계열, 일부 미출석은 회색 계열이다.
 * 클릭 시 동작(호실 상세 다이얼로그)은 별도 스토리라 콜백만 열어 둔다.
 */
export function RoomCard({ room, onClick }: RoomCardProps) {
  const status = roomCardStatus(room);
  const styles = STATUS_STYLES[status];

  return (
    <button
      type="button"
      data-status={status}
      onClick={onClick ? () => onClick(room) : undefined}
      className={`flex h-full min-w-0 flex-col items-start justify-between overflow-hidden rounded-[10px] border p-2.5 text-left md:rounded-[12px] md:p-3 xl:rounded-card xl:p-4 ${styles.card}`}
    >
      <span
        className={`font-mono text-[13px] md:text-[14px] xl:text-[17px] ${styles.number}`}
      >
        {room.number}
      </span>
      <span className={`text-[10px] xl:text-xs ${styles.count}`}>
        {roomCardCountLabel(room)}
      </span>
    </button>
  );
}
