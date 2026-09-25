/**
 * REQ-UI-006: 홈 전개도 로딩 중 본문 스켈레톤.
 * 사이드바·레일·탭바는 유지하고 페이지 콘텐츠 자리를 대신한다.
 * (Figma '상태 컴포넌트' 페이지 mobile/loading 277:5, admin/loading 277:23)
 */
export function AdminFloorPlanSkeleton() {
  return (
    <div className="flex min-h-full w-full animate-pulse flex-col gap-3.5 px-4 py-3.5 md:h-full md:min-h-0 md:gap-4 md:px-[22px] md:py-6">
      {/* 헤더 행 (제목 + 층 탭) */}
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="h-[10px] w-10 rounded-full bg-admin-bg" />
          <div className="h-[26px] w-36 rounded-lg bg-admin-bg md:h-8 md:w-44 xl:h-9 xl:w-52" />
        </div>
        <div className="flex gap-1">
          <div className="h-8 w-10 rounded-lg bg-admin-bg" />
          <div className="h-8 w-10 rounded-lg bg-admin-bg" />
          <div className="h-8 w-10 rounded-lg bg-admin-bg" />
        </div>
      </div>

      {/* 출석 통계 카드 2개 */}
      <div className="flex w-full gap-2 md:gap-7">
        <div className="h-[58px] flex-1 rounded-xl bg-admin-bg md:h-[52px] md:rounded-card" />
        <div className="h-[58px] flex-1 rounded-xl bg-admin-bg md:h-[52px] md:rounded-card" />
      </div>

      {/* 호실 그리드 패널 */}
      <div className="flex w-full flex-1 flex-col gap-2.5 rounded-[16px] bg-admin-surface px-3.5 py-4 md:flex-none md:gap-[14px] md:rounded-[18px] md:p-[20px] xl:flex-1 xl:min-h-0 xl:rounded-panel xl:pb-0">
        {/* 범례 스켈레톤 */}
        <div className="flex items-center gap-2.5 md:gap-[10px]">
          <div className="h-[12px] w-14 rounded-full bg-admin-bg" />
          <div className="h-[12px] w-14 rounded-full bg-admin-bg" />
        </div>

        {/* 호실 카드 그리드 */}
        <div className="grid w-full flex-1 auto-rows-[minmax(40px,1fr)] grid-cols-3 gap-2 md:flex-none md:auto-rows-[92px] md:grid-cols-3 md:gap-[8px] xl:auto-rows-auto xl:grid-cols-7 xl:min-h-0 xl:flex-[650] xl:grid-rows-3">
          {Array.from({ length: 21 }, (_, i) => (
            <div
              key={i}
              className="rounded-[10px] bg-admin-bg md:rounded-[12px] xl:rounded-card"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
