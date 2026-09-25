type NotificationItemProps = {
  message: string;
  /** 상대 시각 문구(예: "오늘 오전 8:12", "어제 오후 3:40", "3일 전") */
  timeLabel: string;
};

/**
 * REQ-COM-005 알림 목록 한 줄 — 알림 문구와 상대 시각을 두 줄로 보여 준다.
 * 핸드폰(Figma 456:478)은 흰 화면 위 회색 카드, 노트북(460:709)은 회색 화면 위 흰 카드다.
 * 누르면 이동하는 규칙은 담당자 결정 사항이고 Figma에도 표시가 없어 지금은 누를 수 없다.
 */
export function NotificationItem({
  message,
  timeLabel,
}: NotificationItemProps) {
  return (
    <li className="flex flex-col gap-0.5 rounded-control bg-admin-rowSurface px-4 py-3.5 leading-normal md:bg-admin-surface md:px-[18px]">
      <p className="text-sm text-admin-text">{message}</p>
      <p className="text-[11px] text-admin-textMuted">{timeLabel}</p>
    </li>
  );
}
