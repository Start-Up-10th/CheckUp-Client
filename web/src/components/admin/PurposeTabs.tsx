import type { Purpose } from "@/lib/admin/purpose";

const DEFAULT_LABELS: Record<Purpose, string> = {
  study: "자습실",
  dorm: "기숙사",
};

type PurposeTabsProps = {
  selected: Purpose;
  onSelect: (purpose: Purpose) => void;
  /** 화면별로 라벨이 다를 수 있다 (예: 얼굴 인식 생성 화면은 "기숙사 입소"). */
  labels?: Partial<Record<Purpose, string>>;
};

/** REQ-ATT-001/003: 자습실/기숙사는 서로 다른 용도이며 기본값은 기숙사다. */
export function PurposeTabs({ selected, onSelect, labels }: PurposeTabsProps) {
  const resolvedLabels = { ...DEFAULT_LABELS, ...labels };

  return (
    <div className="flex items-start gap-[3px] rounded-[10px] bg-[#e6e6e8] p-[3px] md:gap-1 md:rounded-[14px] md:p-[5px]">
      {(Object.keys(resolvedLabels) as Purpose[]).map((value) => {
        const active = value === selected;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(value)}
            className={`rounded-lg px-2.5 py-1.5 text-[11px] leading-[13px] md:rounded-[10px] md:px-[22px] md:py-[9px] md:text-sm ${
              active
                ? "bg-admin-surface font-bold text-admin-text"
                : "font-normal text-admin-textSecondary"
            }`}
          >
            {resolvedLabels[value]}
          </button>
        );
      })}
    </div>
  );
}
