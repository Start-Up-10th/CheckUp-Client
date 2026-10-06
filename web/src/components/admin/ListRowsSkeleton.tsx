/** REQ-UI-006: 목록 로딩은 실제 목록(호실 제목 + 학생 행) 모양의 스켈레톤으로 표시한다. */
export function ListRowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div
      aria-busy="true"
      className="flex animate-pulse flex-col gap-2 motion-reduce:animate-none"
    >
      <span className="sr-only">불러오는 중…</span>
      <div className="h-3.5 w-12 rounded bg-admin-border md:h-4 xl:w-14" />
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 rounded-[11px] bg-admin-rowSurface px-3.5 py-[11px] md:rounded-xl md:px-4 md:py-3 xl:rounded-card xl:px-5 xl:py-3.5"
        >
          <div className="flex flex-col gap-1.5">
            <div className="h-3.5 w-14 rounded bg-admin-border" />
            <div className="h-2.5 w-24 rounded bg-admin-divider" />
          </div>
          <div className="h-[30px] w-[51px] rounded-[10px] bg-admin-border xl:h-[34px] xl:w-[87px]" />
        </div>
      ))}
    </div>
  );
}
