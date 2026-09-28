import type { Room } from "@/lib/admin/mock-floor-data";
import { RoomCard } from "./RoomCard";

const LEGEND_ITEMS = [
  {
    label: "출석",
    swatch: "border-admin-attendance-border bg-admin-attendance-bg",
  },
  {
    label: "미출석",
    swatch: "border-admin-absence-border bg-admin-absence-bg",
  },
] as const;

type RoomCardGridProps = {
  rooms: Room[];
  onRoomClick?: (room: Room) => void;
};

/**
 * REQ-UI-001: 그리드 위에 출석 / 미출석 범례를 두고(공실 범례는 두지 않음),
 * 넓은 화면(xl)은 한 층을 7열 × 3행으로 배치한다. 좁은 화면은 4열 → 3열로 줄인다.
 */
export function RoomCardGrid({ rooms, onRoomClick }: RoomCardGridProps) {
  return (
    <section
      aria-label="호실 전개도"
      className="flex w-full flex-col gap-2.5 rounded-[16px] bg-admin-surface px-3.5 py-4 md:gap-[14px] md:rounded-[18px] md:p-[20px] xl:rounded-panel"
    >
      <ul aria-label="범례" className="flex items-center gap-2.5 md:gap-[14px]">
        {LEGEND_ITEMS.map((item) => (
          <li
            key={item.label}
            className="flex items-center gap-[5px] md:gap-1.5"
          >
            <span
              aria-hidden="true"
              className={`size-2 rounded-[3px] border md:size-[9px] ${item.swatch}`}
            />
            <span className="text-[10px] leading-[12px] text-admin-textMuted md:text-xs">
              {item.label}
            </span>
          </li>
        ))}
      </ul>

      <div className="grid w-full auto-rows-[64px] grid-cols-3 gap-2 md:auto-rows-[78px] md:grid-cols-4 xl:auto-rows-auto xl:grid-cols-7 xl:grid-rows-3">
        {rooms.map((room) => (
          <RoomCard key={room.number} room={room} onClick={onRoomClick} />
        ))}
      </div>
    </section>
  );
}
