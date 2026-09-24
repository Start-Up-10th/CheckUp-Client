import type { Floor } from "@/lib/admin/mock-floor-data";

const FLOORS: Floor[] = [3, 4, 5];

type FloorTabsProps = {
  selected: Floor;
  onSelect: (floor: Floor) => void;
  className?: string;
};

/**
 * 폰(Figma 관리자-핸드폰)은 회색 트랙 안의 세그먼트 묶음, 패드·컴퓨터는 테두리 있는 개별 버튼이다.
 */
export function FloorTabs({ selected, onSelect, className }: FloorTabsProps) {
  return (
    <div className={`flex items-start gap-1 rounded-[11px] bg-[#e6e6e8] p-1 md:gap-2 md:rounded-none md:bg-transparent md:p-0 ${className ?? ""}`}>
      {FLOORS.map((floor) => {
        const active = floor === selected;
        return (
          <button
            key={floor}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(floor)}
            className={`rounded-lg px-3 py-[7px] text-xs leading-[14px] md:rounded-control md:border md:px-[22px] md:py-[9px] md:text-sm md:font-medium md:leading-[17px] ${
              active
                ? "bg-admin-attendance-bg font-bold text-admin-attendance-text md:border-admin-attendance-border"
                : "bg-admin-surface font-normal text-admin-ghost-text md:border-admin-border md:text-admin-text"
            }`}
          >
            {floor}층
          </button>
        );
      })}
    </div>
  );
}
