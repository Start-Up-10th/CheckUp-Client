import type { Floor } from "@/lib/admin/mock-floor-data";

const FLOORS: Floor[] = [3, 4, 5];

type StudentFloorTabsProps = {
  selected: Floor;
  onSelect: (floor: Floor) => void;
};

/**
 * Figma 08 학생 관리의 층 변경: 모든 폭에서 회색 트랙(`#E6E6E8`) 안의 세그먼트다.
 * 핸드폰은 트랙 패딩 4·버튼 12×7·글자 12(선택 Bold), 패드는 트랙 패딩 5·버튼 16×9·글자 14 Medium(선택에 테두리),
 * 컴퓨터는 트랙 패딩 6·버튼 22×10·테두리 없음, 선택 글자는 Bold(사용자 결정 2026-10-07)다.
 */
export function StudentFloorTabs({
  selected,
  onSelect,
}: StudentFloorTabsProps) {
  return (
    <div
      role="group"
      aria-label="층 변경"
      className="flex items-start gap-1 rounded-[11px] bg-[#e6e6e8] p-1 md:gap-1.5 md:rounded-[14px] md:p-[5px] xl:gap-2 xl:rounded-2xl xl:p-1.5"
    >
      {FLOORS.map((floor) => {
        const active = floor === selected;
        return (
          <button
            key={floor}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(floor)}
            className={`rounded-lg px-3 py-[7px] text-xs leading-[14px] md:rounded-[10px] md:border md:border-transparent md:px-[15px] md:py-2 md:text-sm md:font-medium md:leading-[17px] xl:rounded-xl xl:border-0 xl:px-[22px] xl:py-2.5 ${
              active
                ? "bg-admin-attendance-bg font-bold text-admin-attendance-text md:border-admin-attendance-border xl:font-bold"
                : "bg-admin-surface font-normal text-admin-ghost-text xl:font-normal"
            }`}
          >
            {floor}층
          </button>
        );
      })}
    </div>
  );
}
