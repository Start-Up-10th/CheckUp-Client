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
    <div className="flex w-full items-start gap-2 md:gap-3.5">
      <div className="flex flex-1 flex-col gap-1 rounded-xl border border-admin-attendance-border bg-admin-attendance-bg p-[11px] md:rounded-[16px] md:px-[18px] md:py-[15px]">
        <p className="text-[10px] leading-[12px] text-admin-textMuted md:text-xs md:leading-[14px]">
          출석
        </p>
        <p className="text-lg font-bold leading-[22px] text-admin-attendance-text md:text-2xl md:leading-[29px] md:text-admin-text">
          {present}
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-1 rounded-xl bg-admin-surface p-3 md:rounded-[16px] md:px-[18px] md:py-4">
        <p className="text-[10px] leading-[12px] text-admin-textMuted md:text-xs md:leading-[14px]">
          미출석
        </p>
        <p className="text-lg font-bold leading-[22px] text-admin-text md:text-2xl md:leading-[29px]">
          {absent}
        </p>
      </div>
    </div>
  );
}
