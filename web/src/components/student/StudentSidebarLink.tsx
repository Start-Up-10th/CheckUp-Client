import Link from "next/link";

export type SidebarTone = "light" | "dark";

const TONE_STYLES: Record<SidebarTone, { on: string; off: string }> = {
  // 흰 사이드바(Figma 227:16)
  light: {
    on: "bg-admin-attendance-bg font-bold text-admin-attendance-text",
    off: "text-admin-ghost-text",
  },
  // QR 카메라 화면의 어두운 사이드바(Figma 228:21)
  dark: {
    on: "bg-white/10 font-bold text-admin-accent-bg",
    off: "text-white/55",
  },
};

type StudentSidebarLinkProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  current: boolean;
  highlighted: boolean;
  tone: SidebarTone;
  /** 화면에는 안 보이고 화면 낭독기만 읽는 덧붙임 설명 */
  srHint?: string;
};

/**
 * 학생 사이드바 메뉴 한 줄. `highlighted`면 강조한다 — 흰 사이드바는 연두 배경·초록 글씨,
 * 어두운 사이드바는 흰 10% 배경·라임 글씨. 지금 화면이거나, 흰 사이드바에서 읽지 않은 알림이
 * 있을 때(REQ-COM-005)다.
 */
export function StudentSidebarLink({
  href,
  label,
  icon,
  current,
  highlighted,
  tone,
  srHint,
}: StudentSidebarLinkProps) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-control px-3 py-[11px] text-sm leading-normal ${
        highlighted ? TONE_STYLES[tone].on : TONE_STYLES[tone].off
      }`}
    >
      {icon}
      {label}
      {srHint && <span className="sr-only"> ({srHint})</span>}
    </Link>
  );
}
