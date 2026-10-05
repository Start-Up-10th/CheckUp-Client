import type { Floor } from "@/lib/admin/mock-floor-data";

const FLOORS: Floor[] = [3, 4, 5];

type FloorTabsProps = {
  selected: Floor;
  onSelect: (floor: Floor) => void;
  className?: string;
  /** 컴퓨터에서도 회색 트랙 안의 세그먼트로 보인다(Figma 07 봉사자 명단 편집). */
  desktopTrack?: boolean;
};

/**
 * 폰·패드(Figma 관리자-핸드폰·패드)는 회색 트랙 안의 세그먼트 묶음이고 패드가 트랙·버튼이 더 크다(트랙 181×45,
 * 버튼 53×35). 컴퓨터 홈은 테두리 있는 개별 버튼, 봉사자 명단 편집은 트랙 안 세그먼트(`desktopTrack`)다.
 */
export function FloorTabs({
  selected,
  onSelect,
  className,
  desktopTrack = false,
}: FloorTabsProps) {
  return (
    <div
      className={`flex items-start gap-1 rounded-[11px] bg-[#e6e6e8] p-1 md:gap-1.5 md:rounded-[14px] md:p-[5px] ${
        desktopTrack
          ? "xl:gap-2 xl:rounded-[16px] xl:p-1.5"
          : "xl:gap-2 xl:rounded-none xl:bg-transparent xl:p-0"
      } ${className ?? ""}`}
    >
      {FLOORS.map((floor) => {
        const active = floor === selected;
        return (
          <button
            key={floor}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(floor)}
            className={`rounded-lg px-3 py-[7px] text-xs leading-[14px] md:rounded-[10px] md:border md:px-[15px] md:py-2 md:text-sm md:font-medium md:leading-[17px] xl:rounded-control ${
              desktopTrack
                ? "xl:border-transparent xl:px-[22px] xl:py-2.5 xl:font-medium"
                : "xl:px-[21px] xl:py-[9px]"
            } ${
              active
                ? `bg-admin-attendance-bg text-admin-attendance-text md:border-admin-attendance-border ${desktopTrack ? "font-bold xl:border-transparent xl:font-medium" : "font-bold"}`
                : `bg-admin-surface font-normal text-admin-ghost-text md:border-transparent ${desktopTrack ? "xl:text-[#3a3a3c]" : "xl:border-admin-border xl:text-[#3a3a3c]"}`
            }`}
          >
            {floor}층
          </button>
        );
      })}
    </div>
  );
}
