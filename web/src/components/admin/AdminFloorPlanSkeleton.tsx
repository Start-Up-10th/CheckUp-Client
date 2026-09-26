// REQ-UI-006: 홈 전개도 로딩 스켈레톤
// AdminHomeFloorPlan · AttendanceStatCards · FloorTabs · RoomGrid 수치에 맞춘다.
export function AdminFloorPlanSkeleton() {
  return (
    <div className="flex min-h-full w-full animate-pulse flex-col gap-3.5 px-4 py-3.5 md:h-full md:min-h-0 md:gap-4 md:px-[22px] md:py-6 xl:p-[22px]">
      {/* 헤더 — xl에서 숨김 */}
      <div className="flex w-full items-center justify-between md:items-end xl:hidden">
        {/* 타이틀: flex-col gap-0.5 md:gap-1 */}
        <div className="flex flex-col gap-0.5 md:gap-1">
          {/* label: text-[10px] leading-[13px] */}
          <div className="h-[13px] w-16 rounded bg-admin-bg" />
          {/* h1: text-[22px] leading-[26px] / md:text-[26px] leading-normal(39px) */}
          <div className="h-[26px] w-28 rounded-lg bg-admin-bg md:h-[39px] md:w-36" />
        </div>
        {/* FloorTabs: mobile=pill 트랙, md=개별 버튼 */}
        <div className="flex items-start gap-1 rounded-[11px] bg-[#e6e6e8] p-1 md:gap-2 md:rounded-none md:bg-transparent md:p-0">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              // mobile: px-3 py-[7px] → h-7(28px), 실측 ~44px 폭
              // md: px-[22px] py-[9px] leading-[17px] → h-[35px], ~68px 폭
              className="h-7 w-[44px] rounded-lg bg-admin-surface md:h-[35px] md:w-[68px] md:rounded-control md:border md:border-admin-border"
            />
          ))}
        </div>
      </div>

      {/* 통계 카드 — xl에서 숨김 */}
      {/* 실제: flex w-full items-start gap-2 md:gap-7 */}
      <div className="flex w-full items-start gap-2 md:gap-7 xl:hidden">
        {[0, 1].map((i) => (
          <div
            key={i}
            // 실제 카드 2: p-3(12px) mobile, md:px-[16px] py-[14px] rounded-card border
            className="flex flex-1 flex-col gap-1 rounded-xl bg-admin-surface p-3 md:flex-row md:items-baseline md:justify-between md:rounded-card md:border md:border-admin-attendance-border md:px-[16px] md:py-[14px]"
          >
            {/* label: text-[10px] leading-[12px] / md:text-xs leading-[14px] */}
            <div className="h-3 w-10 rounded bg-admin-bg md:h-[14px]" />
            {/* value: text-lg leading-[22px] / md:text-[22px] leading-normal(33px) */}
            <div className="h-[22px] w-8 rounded-lg bg-admin-bg md:h-[33px]" />
          </div>
        ))}
      </div>

      {/* 호실 그리드 패널 — RoomGrid와 동일한 외곽 구조 */}
      <div className="flex w-full flex-1 flex-col gap-2.5 rounded-[16px] bg-admin-surface px-3.5 py-4 md:flex-none md:gap-[14px] md:rounded-[18px] md:px-[20px] md:pb-[46px] md:pt-[20px] xl:flex-1 xl:min-h-0 xl:overflow-visible xl:rounded-panel xl:pb-0">
        {/* 범례: 실제 dot+text 높이 = 12px(mobile) / 14px(md) */}
        <div className="flex items-center gap-2.5 md:gap-[10px]">
          <div className="h-3 w-[44px] rounded-[3px] bg-admin-bg md:h-[14px] xl:w-[60px] xl:rounded-[4px]" />
          <div className="h-3 w-[44px] rounded-[3px] bg-admin-bg md:h-[14px] xl:w-[60px] xl:rounded-[4px]" />
          <div className="hidden h-[10px] w-[60px] rounded-[4px] bg-admin-bg xl:block" />
        </div>

        {/* 그리드 래퍼 — RoomGrid와 동일 */}
        <div className="flex w-full flex-1 flex-col xl:min-h-0">
          <div className="grid w-full flex-1 auto-rows-[minmax(40px,1fr)] grid-cols-3 gap-2 md:flex-none md:auto-rows-[92px] md:gap-[8px] xl:auto-rows-auto xl:min-h-0 xl:flex-[650] xl:grid-cols-7 xl:grid-rows-3">
            {Array.from({ length: 21 }, (_, i) => (
              <div
                key={i}
                className="rounded-[10px] bg-admin-rowSurface md:rounded-[12px] xl:flex xl:flex-col xl:justify-between xl:rounded-card xl:p-3"
              >
                <div className="hidden h-[10px] w-7 rounded-[3px] bg-admin-border xl:block" />
                <div className="hidden h-2 w-9 rounded-[3px] bg-admin-divider xl:block" />
              </div>
            ))}
          </div>
          <div className="hidden xl:block xl:min-h-0 xl:flex-[62]" />
        </div>
      </div>
    </div>
  );
}
