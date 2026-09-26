type VolunteerHistoryItemProps = {
  /** 날짜(요일) 문구(예: "9월 12일 (금)") */
  dateLabel: string;
  count: number;
};

/**
 * REQ-COM-003 봉사 활동 내역 한 줄 — 왼쪽에 날짜(요일), 오른쪽에 적립 횟수.
 * 핸드폰(Figma 319:295)은 흰 화면 위 회색 카드(좌우 16px), 노트북(322:379)은 회색 화면 위
 * 흰 카드(좌우 18px)다. Figma의 활동명은 예시라 넣지 않고(REQ-COM-002, 팀원 확인 2026-09-26),
 * 날짜를 활동명 자리(14px 검정)로 올린 한 줄로 둔다 — 이 모양은 Figma에 없어 정한 값이다.
 * 카드 높이는 Figma와 같은 60px로 유지한다.
 */
export function VolunteerHistoryItem({
  dateLabel,
  count,
}: VolunteerHistoryItemProps) {
  return (
    <li className="flex h-[60px] items-center justify-between rounded-control bg-admin-rowSurface px-4 md:bg-admin-surface md:px-[18px]">
      <p className="text-sm leading-[17px] text-admin-text">{dateLabel}</p>
      <p className="text-xs font-bold leading-[14px] text-admin-attendance-text">
        {count}회
      </p>
    </li>
  );
}
