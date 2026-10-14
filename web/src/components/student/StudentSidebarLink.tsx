import Link from "next/link";

/**
 * light: 흰 사이드바(다크 모드에서는 색 토큰대로 어두워진다).
 * camera: QR 카메라 화면. 라이트 모드는 흰 사이드바, 다크 모드는 어두운 사이드바(Figma 228:6)다(DEC-091).
 * 모드는 첫 화면 스크립트가 `html`에 먼저 붙이므로 JS로 읽지 않고 `dark:` 변형으로만 나눈다(첫 화면 깜빡임 방지).
 */
export type SidebarTone = "light" | "camera";

const TONE_STYLES: Record<SidebarTone, { on: string; off: string }> = {
  // 흰 사이드바(Figma 227:16)
  light: {
    on: "bg-admin-attendance-bg font-bold text-admin-attendance-text",
    off: "text-admin-ghost-text hover:bg-admin-bg",
  },
  // QR 카메라 화면: 라이트는 흰 사이드바, 다크는 어두운 사이드바(Figma 228:21)
  camera: {
    on: "bg-admin-attendance-bg font-bold text-admin-attendance-text dark:bg-white/10 dark:text-admin-accent-bg",
    off: "text-admin-ghost-text hover:bg-admin-bg dark:text-white/55 dark:hover:bg-white/5 dark:hover:text-white/80",
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
 * 어두운 사이드바(QR 카메라 화면의 다크 모드)는 흰 10% 배경·라임 글씨. 지금 화면(또는 그 하위 화면)일 때다. 읽지 않은 알림은
 * 강조가 아니라 종의 빨간 점으로 알린다(REQ-COM-005).
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
      className={`flex flex-col items-center justify-center gap-1.5 rounded-control px-1 py-[11px] text-[11px] leading-normal transition-colors xl:flex-row xl:justify-start xl:gap-2.5 xl:px-3 xl:text-sm ${highlighted ? TONE_STYLES[tone].on : TONE_STYLES[tone].off}`}
    >
      {icon}
      {label}
      {srHint && <span className="sr-only"> ({srHint})</span>}
    </Link>
  );
}
