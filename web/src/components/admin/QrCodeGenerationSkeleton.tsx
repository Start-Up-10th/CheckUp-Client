/** REQ-UI-006: 본문 로딩은 스켈레톤으로 표시한다. */
export function QrCodeGenerationSkeleton() {
  return (
    <div className="flex h-full w-full flex-1 animate-pulse items-center justify-center rounded-panel bg-admin-surface">
      <div className="flex flex-col items-center gap-4">
        <div className="size-[300px] rounded-[18px] bg-admin-bg" />
        <div className="flex flex-col items-center gap-2">
          <div className="h-[11px] w-24 rounded-full bg-admin-bg" />
          <div className="h-[38px] w-32 rounded-full bg-admin-bg" />
        </div>
      </div>
    </div>
  );
}
