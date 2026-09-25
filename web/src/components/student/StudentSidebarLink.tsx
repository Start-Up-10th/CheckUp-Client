import Link from "next/link";

type StudentSidebarLinkProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  current: boolean;
  highlighted: boolean;
  /** 화면에는 안 보이고 화면 낭독기만 읽는 덧붙임 설명 */
  srHint?: string;
};

/**
 * 학생 사이드바 메뉴 한 줄(Figma 227:16). `highlighted`면 초록 배경·굵은 초록 글씨다 —
 * 지금 화면이거나, 알림 항목에 읽지 않은 알림이 있을 때(REQ-COM-005).
 */
export function StudentSidebarLink({
  href,
  label,
  icon,
  current,
  highlighted,
  srHint,
}: StudentSidebarLinkProps) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-control px-3 py-[11px] text-sm leading-normal ${
        highlighted
          ? "bg-admin-attendance-bg font-bold text-admin-attendance-text"
          : "text-admin-ghost-text"
      }`}
    >
      {icon}
      {label}
      {srHint && <span className="sr-only"> ({srHint})</span>}
    </Link>
  );
}
