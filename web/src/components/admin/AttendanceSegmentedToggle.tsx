type AttendanceSegmentedToggleProps = {
  present: boolean;
  onChange: (present: boolean) => void;
};

/** Figma 572:158 "출석 토글": 회색 트랙 위에서 선택된 쪽만 필(pill)로 강조한다. */
export function AttendanceSegmentedToggle({
  present,
  onChange,
}: AttendanceSegmentedToggleProps) {
  return (
    <div className="flex items-start gap-0.5 rounded-full bg-admin-absence-bg p-0.5">
      <button
        type="button"
        onClick={() => onChange(true)}
        aria-pressed={present}
        className={`flex h-[26px] w-[58px] items-center justify-center rounded-full text-xs ${
          present
            ? "bg-admin-accent-bg font-bold text-admin-accent-text"
            : "font-normal text-admin-textFaint"
        }`}
      >
        출석
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        aria-pressed={!present}
        className={`flex h-[26px] w-[58px] items-center justify-center rounded-full text-xs ${
          !present
            ? "bg-admin-surface font-bold text-admin-ghost-text"
            : "font-normal text-admin-textFaint"
        }`}
      >
        미출석
      </button>
    </div>
  );
}
