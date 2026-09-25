import type { Room } from "@/lib/admin/mock-floor-data";
import { RoomCard } from "@/components/admin/RoomCard";

type RoomGridProps = {
  rooms: Room[];
  onRoomClick?: (room: Room) => void;
};

/**
 * REQ-UI-001: 공실 범례·공실 관리는 구현하지 않는다 (빈 방이 없다는 전제).
 * 폰(Figma 관리자-핸드폰)은 3열이고 행이 남은 세로 공간을 균등하게 채운다(스크롤 없음).
 * 데스크톱(xl, 7열)에서는 방이 몇 개든 항상 3행이라 남은 세로 공간에 꽉 차게 채워서 스크롤이 생기지 않는다.
 * 카드 영역과 하단 여백은 Figma 1920 기준 비율(650:62)로 함께 늘었다 줄었다 한다 — 여백만 고정폭으로
 * 두면 화면이 커질수록 카드만 계속 커지고 여백 비율은 안 맞아 보인다.
 * 패드(md~xl, 4열)는 행이 많아져 세로로 길어지는 게 정상이라 그대로 스크롤한다.
 */
export function RoomGrid({ rooms, onRoomClick }: RoomGridProps) {
  return (
    <div className="flex w-full flex-1 flex-col gap-2.5 rounded-[16px] bg-admin-surface px-3.5 py-4 md:flex-none md:gap-[14px] md:rounded-[18px] md:p-[20px] xl:flex-1 xl:min-h-0 xl:overflow-visible xl:pb-0 xl:rounded-panel">
      {/* 폰: 한 행. 패드: 범례 아래에 안내 텍스트 2행. 데스크톱: 한 행 100px. */}
      <div className="flex w-full flex-col gap-1.5 xl:h-[100px] xl:flex-row xl:items-center xl:gap-[18px]">
        <div className="flex items-center gap-2.5 md:gap-[14px]">
          <div className="flex items-center gap-[5px] md:gap-1.5">
            <span className="size-2 rounded-[3px] border border-admin-attendance-border bg-admin-attendance-bg md:size-[9px]" />
            <span className="text-[10px] leading-[12px] text-admin-textMuted md:text-xs">
              출석
            </span>
          </div>
          <div className="flex items-center gap-[5px] md:gap-1.5">
            <span className="size-2 rounded-[3px] border border-admin-absence-border bg-admin-absence-bg md:size-[9px]" />
            <span className="text-[10px] leading-[12px] text-admin-textMuted md:text-xs">
              미출석
            </span>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-1 flex-col xl:min-h-0">
        <div className="grid w-full flex-1 auto-rows-[minmax(40px,1fr)] grid-cols-3 gap-2 md:flex-none md:auto-rows-[96px] md:grid-cols-3 md:gap-[14px] xl:auto-rows-auto xl:grid-cols-7 xl:min-h-0 xl:flex-[650] xl:grid-rows-3">
          {rooms.map((room) => (
            <RoomCard key={room.number} room={room} onClick={onRoomClick} />
          ))}
        </div>
        <div className="hidden xl:block xl:min-h-0 xl:flex-[62]" />
      </div>
    </div>
  );
}
