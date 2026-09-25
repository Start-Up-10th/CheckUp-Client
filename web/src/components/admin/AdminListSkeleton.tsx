/**
 * REQ-UI-006: 봉사자 관리·명단 편집 목록 로딩 중 본문 스켈레톤.
 * 사이드바·레일·탭바는 유지하고 페이지 콘텐츠 자리를 대신한다.
 * (Figma '상태 컴포넌트' 페이지 규격 기반, VolunteerListRow 높이 기준)
 */
export function AdminListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex min-h-full w-full animate-pulse flex-col gap-3.5 px-4 py-3.5 md:gap-4 md:px-[22px] md:py-6">
      {/* 헤더 행 */}
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="h-[10px] w-16 rounded-full bg-admin-bg" />
          <div className="h-[26px] w-32 rounded-lg bg-admin-bg md:h-8 md:w-40 xl:h-9 xl:w-48" />
        </div>
        <div className="h-[40px] w-20 rounded-[13px] bg-admin-bg md:h-[48px] md:w-24" />
      </div>

      {/* 목록 패널 */}
      <div className="flex min-h-0 w-full flex-1 flex-col gap-2.5 rounded-[16px] bg-admin-surface px-3.5 py-4 md:rounded-[18px] md:p-[20px] xl:rounded-panel">
        {/* 섹션 레이블 */}
        <div className="h-[13px] w-14 rounded-full bg-admin-bg" />

        {/* 목록 행들 */}
        <div className="flex flex-col gap-2">
          {Array.from({ length: rows }, (_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-[11px] bg-admin-rowSurface px-3.5 py-[11px] md:rounded-[12px] md:px-4 md:py-3"
            >
              <div className="flex flex-col gap-1.5">
                <div className="h-[16px] w-20 rounded-full bg-admin-bg" />
                <div className="h-[12px] w-28 rounded-full bg-admin-bg" />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-[23px] w-10 rounded-lg bg-admin-bg md:h-[26px]" />
                <div className="size-6 rounded-full bg-admin-bg md:size-[26px]" />
                <div className="size-6 rounded-full bg-admin-bg md:size-[26px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
