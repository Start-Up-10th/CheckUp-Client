type AttendanceStatCardsProps = {
  present: number;
  absent: number;
};

/**
 * REQ-UI-001: 출석/미출석 2개 카드만 표시한다. 총원 통계 카드는 추가하지 않는다.
 * 패드(md, Figma 52:53)는 라벨 왼쪽·숫자 오른쪽 가로 배치, 데스크톱(xl, Figma 16:445)은 라벨 위·숫자 아래 세로 스택이다.
 */
export function AttendanceStatCards({
  present,
  absent,
}: AttendanceStatCardsProps) {
  return (
    <div className="flex w-full items-start gap-2 md:gap-7 xl:gap-[14px]">
      <div className="flex flex-1 flex-col gap-1 rounded-xl border border-admin-attendance-border bg-admin-attendance-bg p-3 md:flex-row md:items-baseline md:justify-between md:rounded-card md:px-[16px] md:py-[14px] xl:flex-col xl:items-start xl:justify-normal xl:px-[18px] xl:py-[16px]">
        <p className="text-[10px] leading-[12px] text-admin-attendance-textMuted md:text-xs md:leading-[14px]">
          출석
        </p>
        <p className="text-lg font-bold leading-[22px] text-admin-attendance-text md:text-[22px] md:leading-normal">
          {present}
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-1 rounded-xl border border-admin-absence-border bg-admin-surface p-3 md:flex-row md:items-baseline md:justify-between md:rounded-card md:px-[16px] md:py-[14px] xl:flex-col xl:items-start xl:justify-normal xl:px-[18px] xl:py-[16px]">
        <p className="text-[10px] leading-[12px] text-admin-textMuted md:text-xs md:leading-[14px]">
          미출석
        </p>
        <p className="text-lg font-bold leading-[22px] text-admin-text md:text-[22px] md:leading-normal">
          {absent}
        </p>
      </div>
    </div>
  );
}
