import type { Floor } from "@/lib/admin/mock-floor-data";

const FLOORS: Floor[] = [3, 4, 5];

type FloorTabsProps = {
  selected: Floor;
  onSelect: (floor: Floor) => void;
};

export function FloorTabs({ selected, onSelect }: FloorTabsProps) {
  return (
    <div className="flex items-start gap-2">
      {FLOORS.map((floor) => {
        const active = floor === selected;
        return (
          <button
            key={floor}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(floor)}
            className={`rounded-control border px-[22px] py-[9px] text-sm font-medium leading-[17px] ${
              active
                ? "border-admin-attendance-border bg-admin-attendance-bg text-admin-attendance-text"
                : "border-admin-border bg-admin-surface text-admin-text"
            }`}
          >
            {floor}층
          </button>
        );
      })}
    </div>
  );
}
