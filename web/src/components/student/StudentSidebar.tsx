"use client";

import { usePathname } from "next/navigation";
import type { CurrentStudentProfile } from "@/lib/student/current-student";
import { useLogout } from "@/lib/student/use-logout";
import { MaskIcon } from "./MaskIcon";
import { StudentSidebarLink, type SidebarTone } from "./StudentSidebarLink";

// subPaths: 그 메뉴 안에서 들어가는 하위 화면. 거기 있을 때도 메뉴를 초록으로 강조한다
// (Figma 노트북 봉사 활동 322:341에서 마이페이지가 강조됨).
const NAV_ITEMS = [
  { href: "/main", label: "홈", iconSrc: "/icons/student-nav/home.svg" },
  { href: "/qr", label: "QR 출석", iconSrc: "/icons/student-nav/qr.svg" },
  {
    href: "/my",
    label: "마이페이지",
    iconSrc: "/icons/student-nav/my.svg",
    subPaths: ["/volunteer"],
  },
];

type StudentSidebarProps = {
  /** 본인 정보. 받기 전이거나 받지 못했으면 null이고, 프로필 카드는 비워 둔다(높이는 유지). */
  profile: CurrentStudentProfile | null;
  hasUnreadNotification: boolean;
  /** QR 카메라 화면만 어두운 사이드바(Figma 228:6)를 쓴다. */
  tone?: SidebarTone;
};

/**
 * REQ-UI-004: 학생 노트북(md 이상) 좌측 사이드바 — 프로필·홈·QR 출석·마이페이지·알림·하단 로그아웃.
 * Figma 사용자-노트북 227:6(폭 240px). 읽지 않은 알림은 종 안의 빨간 점(수정된 Figma 889:11)으로만
 * 알리고, 알림 항목의 초록 강조는 알림 화면에 있을 때만 쓴다(REQ-COM-005, 2026-09-25 변경).
 * 알림을 읽은 상태의 종(bell.svg)은 Figma에 없어 bell-unread.svg에서 빨간 점만 뺐다.
 * 로그아웃 동작은 핸드폰 로그아웃 버튼과 같은 useLogout()을 쓴다(REQ-AUTH-005).
 * 어두운 사이드바(QR 카메라, Figma 228:6)는 Figma 그대로다: 테두리 없음, 프로필 카드 흰 6%.
 * 종은 수정된 Figma(889:5)대로 회색 선에 빨간 점이라 어두운 배경에서도 보인다(bell-unread-dark.svg).
 */
/** 사이드바 프로필의 호실 문구. 호실이 배정되지 않았으면 Figma에 없어 `호실 미배정`으로 쓴다. */
function roomLabel(roomNumber: string | null): string {
  return roomNumber === null ? "호실 미배정" : `${roomNumber}호`;
}

export function StudentSidebar({
  profile,
  hasUnreadNotification,
  tone = "light",
}: StudentSidebarProps) {
  const dark = tone === "dark";
  const pathname = usePathname();
  const logout = useLogout();
  const onNotifications = pathname === "/notifications";

  return (
    <aside
      className={`hidden h-dvh w-60 shrink-0 flex-col gap-1 px-5 pb-6 pt-7 md:sticky md:top-0 md:flex ${
        dark ? "bg-admin-text" : "border-r border-admin-border bg-admin-surface"
      }`}
    >
      <div
        className={`flex h-16 items-center rounded-card p-3 ${
          dark ? "bg-white/[0.06]" : "bg-admin-rowSurface"
        }`}
      >
        <div className="flex flex-col gap-px leading-normal">
          <p
            className={`text-sm font-bold ${dark ? "text-white" : "text-admin-text"}`}
          >
            {profile ? profile.name : "\u00a0"}
          </p>
          <p
            className={`text-[11px] ${dark ? "text-white/50" : "text-admin-textMuted"}`}
          >
            {profile
              ? `${profile.studentNumber} · ${roomLabel(profile.roomNumber)}`
              : "\u00a0"}
          </p>
        </div>
      </div>
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ href, label, iconSrc, subPaths }) => {
          const current = pathname === href;
          const highlighted = current || !!subPaths?.includes(pathname);
          return (
            <StudentSidebarLink
              key={href}
              href={href}
              label={label}
              current={current}
              highlighted={highlighted}
              tone={tone}
              icon={
                <MaskIcon
                  src={iconSrc}
                  className={`size-[19px] ${
                    highlighted
                      ? "text-admin-attendance-text"
                      : "text-admin-textMuted"
                  }`}
                />
              }
            />
          );
        })}
        <StudentSidebarLink
          href="/notifications"
          label="알림"
          srHint={hasUnreadNotification ? "읽지 않은 알림 있음" : undefined}
          current={onNotifications}
          highlighted={onNotifications}
          tone={tone}
          icon={
            hasUnreadNotification ? (
              // eslint-disable-next-line @next/next/no-img-element -- 빨간 점 색을 유지해야 해서 mask 대신 원본 SVG를 그대로 쓴다
              <img
                src={
                  dark
                    ? "/icons/student-nav/bell-unread-dark.svg"
                    : "/icons/student-nav/bell-unread.svg"
                }
                alt=""
                aria-hidden="true"
                width={19}
                height={19}
                className="size-[19px] shrink-0"
              />
            ) : (
              <MaskIcon
                src="/icons/student-nav/bell.svg"
                className="size-[19px] text-admin-textMuted"
              />
            )
          }
        />
      </nav>
      <div className="flex-1" />
      <button
        type="button"
        onClick={logout}
        className="flex items-center gap-2.5 rounded-control bg-admin-danger-bg px-3 py-[11px] text-sm leading-normal text-admin-danger-text"
      >
        <MaskIcon src="/icons/student-nav/logout.svg" className="size-[18px]" />
        로그아웃
      </button>
    </aside>
  );
}
