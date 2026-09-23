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
    <div className="flex w-full items-start gap-3.5">
      <div className="flex flex-1 flex-col gap-1 rounded-[16px] border border-admin-attendance-border bg-admin-attendance-bg px-[18px] py-[15px]">
        <p className="text-xs leading-[14px] text-admin-textMuted">출석</p>
        <p className="text-2xl font-bold leading-[29px] text-admin-text">
          {present}
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-1 rounded-[16px] bg-admin-surface px-[18px] py-4">
        <p className="text-xs leading-[14px] text-admin-textMuted">미출석</p>
        <p className="text-2xl font-bold leading-[29px] text-admin-text">
          {absent}
        </p>
      </div>
    </div>
  );
}
