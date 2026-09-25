type AttendanceStatCardsProps = {
  present: number;
  absent: number;
};

/** REQ-UI-001: 출석/미출석 2개 카드만 표시한다. 총원 통계 카드는 추가하지 않는다. */
export function AttendanceStatCards({
  present,
  absent,
}: AttendanceStatCardsProps) {
  return (
    <div className="flex w-full items-start gap-2 md:gap-7">
      <div className="flex flex-1 flex-col gap-1 rounded-xl border border-admin-attendance-border bg-admin-attendance-bg p-[11px] md:flex-row md:items-baseline md:justify-between md:rounded-card md:px-[16px] md:py-[14px]">
        <p className="text-[10px] leading-[12px] text-admin-textMuted md:text-xs md:leading-[14px] md:text-admin-attendance-textMuted">
          출석
        </p>
        <p className="text-lg font-bold leading-[22px] text-admin-attendance-text md:text-[22px] md:leading-normal">
          {present}
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-1 rounded-xl bg-admin-surface p-3 md:flex-row md:items-baseline md:justify-between md:rounded-card md:border md:border-admin-attendance-border md:px-[16px] md:py-[14px]">
        <p className="text-[10px] leading-[12px] text-admin-textMuted md:text-xs md:leading-[14px] md:text-admin-attendance-textMuted">
          미출석
        </p>
        <p className="text-lg font-bold leading-[22px] text-admin-text md:text-[22px] md:leading-normal md:text-admin-attendance-text">
          {absent}
        </p>
      </div>
    </div>
  );
}
