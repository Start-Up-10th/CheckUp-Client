/** REQ-UI-006: 본문 로딩은 스켈레톤으로 표시한다. */
export function QrCodeGenerationSkeleton() {
  return (
    <div className="flex h-full w-full flex-1 animate-pulse items-center justify-center rounded-[18px] bg-admin-surface md:rounded-panel">
      <div className="flex flex-col items-center gap-[18px] md:gap-4">
        <div className="size-[180px] rounded-[18px] bg-admin-bg md:size-[300px]" />
        <div className="flex flex-col items-center gap-2">
          <div className="h-[11px] w-24 rounded-full bg-admin-bg" />
          <div className="h-[38px] w-32 rounded-full bg-admin-bg" />
        </div>
      </div>
    </div>
  );
}
