type StudentEmptyStateProps = {
  title: string;
  description: string;
};

/**
 * REQ-UI-006 공통 빈 상태 — 목록에 보여 줄 것이 없을 때 내용 자리를 대신한다
 * (Figma 알림 빈 상태: 핸드폰 463:52 354×300, 노트북 463:126 640×300, 흰 배경).
 * 상자 아이콘은 관리자 화면과 같은 public/icons/state-empty.svg다. 문구는 화면마다 받는다
 * (예: 알림 "아직 알림이 없어요" / "새 알림이 오면 여기에 표시됩니다.").
 */
export function StudentEmptyState({
  title,
  description,
}: StudentEmptyStateProps) {
  return (
    <div className="flex min-h-[300px] w-full flex-col items-center justify-center gap-4 bg-admin-surface text-center leading-normal">
      <span className="flex size-[72px] items-center justify-center rounded-full bg-admin-bg">
        {/* eslint-disable-next-line @next/next/no-img-element -- 32px 정적 SVG라 next/image 최적화가 필요 없다 */}
        <img
          src="/icons/state-empty.svg"
          alt=""
          aria-hidden="true"
          width={32}
          height={32}
          className="size-8"
        />
      </span>
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-[19px] font-bold text-admin-text">{title}</p>
        <p className="text-sm text-admin-textMuted">{description}</p>
      </div>
    </div>
  );
}
