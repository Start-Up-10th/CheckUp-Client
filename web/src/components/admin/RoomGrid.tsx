import type { ReactNode } from "react";
import type { Room } from "@/lib/admin/floor-types";
import { RoomCard } from "@/components/admin/RoomCard";

type RoomGridProps = {
  rooms: Room[];
  onRoomClick?: (room: Room) => void;
  /** 범례 줄 오른쪽에 둘 조작(날짜 선택). */
  action?: ReactNode;
  /** 새 날짜·층 현황을 받는 중이라 이전 값을 흐리게 보인다. */
  busy?: boolean;
};

/**
 * REQ-UI-001: 공실 범례·공실 관리는 구현하지 않는다 (빈 방이 없다는 전제).
 * 폰(Figma 관리자-핸드폰)은 3열이고 행이 남은 세로 공간을 균등하게 채운다(높이 620px를 넘는 작은 폰(예: 375×667)은 이름 때문에 약간 스크롤된다, DEC-115).
 * 데스크톱(xl, 7열)에서는 방이 몇 개든 항상 3행이라 남은 세로 공간에 꽉 차게 채워서 스크롤이 생기지 않는다.
 * 카드 영역과 하단 여백은 Figma 1920 기준 비율(650:62)로 함께 늘었다 줄었다 한다 — 여백만 고정폭으로
 * 두면 화면이 커질수록 카드만 계속 커지고 여백 비율은 안 맞아 보인다.
 * 패드(md~xl, 3열)는 남은 세로 공간에 맞춰 행 높이가 92px(Figma)에서 72px까지 줄어든다. 카드의 이름 2줄이 잘리지 않는 최소 높이라 키가 낮은 가로 화면은 약간 스크롤된다(DEC-115, DEC-066 일부 대체).
 */
export function RoomGrid({ rooms, onRoomClick, action, busy }: RoomGridProps) {
  return (
    <div className="flex w-full flex-1 flex-col gap-2.5 rounded-[16px] bg-admin-surface px-3.5 py-4 md:min-h-0 md:flex-1 md:gap-[14px] xl:gap-4 md:rounded-[18px] md:px-[20px] md:pb-[46px] md:pt-[20px] xl:flex-1 xl:min-h-0 xl:overflow-visible xl:px-[22px] xl:pb-0 xl:pt-[22px] xl:rounded-panel">
      {/* 범례는 왼쪽, 날짜 선택은 오른쪽의 한 줄이다. 컴퓨터는 44px. */}
      <div className="flex w-full items-center justify-between gap-3 md:min-h-9 xl:h-11">
        <div className="flex items-center gap-2.5 md:gap-[10px] xl:gap-[18px]">
          <div className="flex items-center gap-[5px] md:gap-[7px]">
            <span className="size-2 rounded-[3px] border border-admin-attendance-border bg-admin-attendance-bg md:size-[9px]" />
            <span className="text-[10px] leading-[12px] text-admin-textMuted md:text-xs">
              출석
            </span>
          </div>
          <div className="flex items-center gap-[5px] md:gap-[7px]">
            <span className="size-2 rounded-[3px] border border-admin-absence-border bg-admin-absence-bg md:size-[9px]" />
            <span className="text-[10px] leading-[12px] text-admin-textMuted md:text-xs">
              미출석
            </span>
          </div>
        </div>
        {action}
      </div>

      <div
        className={`flex min-h-0 w-full flex-1 flex-col transition-opacity xl:min-h-0 ${busy ? "opacity-50" : ""}`}
      >
        <div className="grid w-full flex-1 auto-rows-[minmax(40px,1fr)] grid-cols-3 gap-2 [@media(max-height:620px)]:auto-rows-[minmax(28px,1fr)] [@media(max-height:620px)]:gap-1 md:[@media(max-height:620px)]:gap-2 md:min-h-0 md:flex-1 md:auto-rows-[minmax(72px,92px)] md:grid-cols-3 md:gap-[8px] xl:gap-[10px] xl:auto-rows-auto xl:grid-cols-7 xl:min-h-0 xl:flex-[650] xl:grid-rows-3">
          {rooms.map((room) => (
            <RoomCard key={room.number} room={room} onClick={onRoomClick} />
          ))}
        </div>
        <div className="hidden xl:block xl:min-h-0 xl:flex-[62]" />
      </div>
    </div>
  );
}
