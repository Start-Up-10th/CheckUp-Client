import type { Floor } from "@/lib/admin/mock-floor-data";

const FLOORS: Floor[] = [3, 4, 5];

type FloorTabsProps = {
  selected: Floor;
  onSelect: (floor: Floor) => void;
  className?: string;
};

/**
 * 모든 폭에서 회색 트랙(`#E6E6E8`) 안의 세그먼트 묶음이다(사용자 결정 2026-10-07: 컴퓨터도 핸드폰 디자인에 맞춤).
 * 핸드폰은 트랙 패딩 4·버튼 12×7·글자 12, 패드는 트랙 패딩 5·버튼 15×8·글자 14 Medium(선택에 테두리),
 * 컴퓨터는 트랙 패딩 6·버튼 22×10·테두리 없음이다. 선택 글자는 핸드폰·컴퓨터에서 Bold다.
 */
export function FloorTabs({ selected, onSelect, className }: FloorTabsProps) {
  return (
    <div
      className={`flex items-start gap-1 rounded-[11px] bg-[#e6e6e8] p-1 md:gap-1.5 md:rounded-[14px] md:p-[5px] xl:gap-2 xl:rounded-[16px] xl:p-1.5 ${className ?? ""}`}
    >
      {FLOORS.map((floor) => {
        const active = floor === selected;
        return (
          <button
            key={floor}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(floor)}
            className={`rounded-lg px-3 py-[7px] text-xs leading-[14px] md:rounded-[10px] md:border md:px-[15px] md:py-2 md:text-sm md:font-medium md:leading-[17px] xl:rounded-control xl:border-transparent xl:px-[22px] xl:py-2.5 ${
              active
                ? "bg-admin-attendance-bg font-bold text-admin-attendance-text md:border-admin-attendance-border xl:font-bold"
                : "bg-admin-surface font-normal text-admin-ghost-text md:border-transparent xl:font-normal xl:text-[#3a3a3c]"
            }`}
          >
            {floor}층
          </button>
        );
      })}
    </div>
  );
}
