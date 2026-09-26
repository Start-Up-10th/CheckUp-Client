type VolunteerHistoryItemProps = {
  activityName: string;
  /** 날짜(요일) 문구(예: "9월 12일 (금)") */
  dateLabel: string;
  count: number;
};

/**
 * REQ-COM-003 봉사 활동 내역 한 줄 — 왼쪽에 활동명·날짜(요일) 두 줄, 오른쪽에 적립 횟수.
 * 핸드폰(Figma 319:295)은 흰 화면 위 회색 카드(좌우 16px), 노트북(322:379)은 회색 화면 위
 * 흰 카드(좌우 18px)다. 줄 높이는 Figma 글자 상자(17px·13px·14px)에 맞춰 한 줄이 60px이 되게 했다.
 */
export function VolunteerHistoryItem({
  activityName,
  dateLabel,
  count,
}: VolunteerHistoryItemProps) {
  return (
    <li className="flex items-center justify-between rounded-control bg-admin-rowSurface px-4 py-3.5 md:bg-admin-surface md:px-[18px]">
      <div className="flex flex-col gap-0.5">
        <p className="text-sm leading-[17px] text-admin-text">{activityName}</p>
        <p className="text-[11px] leading-[13px] text-admin-textMuted">
          {dateLabel}
        </p>
      </div>
      <p className="text-xs font-bold leading-[14px] text-admin-attendance-text">
        {count}회
      </p>
    </li>
  );
}
