"use client";

import { usePathname, useRouter } from "next/navigation";
import { MaskIcon } from "./MaskIcon";
import { StudentSidebarLink } from "./StudentSidebarLink";

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
  name: string;
  studentNumber: string;
  room: string;
  hasUnreadNotification: boolean;
};

/**
 * REQ-UI-004: 학생 노트북(md 이상) 좌측 사이드바 — 프로필·홈·QR 출석·마이페이지·알림·하단 로그아웃.
 * Figma 사용자-노트북 227:6(폭 240px). 알림을 읽은 상태의 종(bell.svg)은 Figma에 없어
 * bell-unread.svg에서 빨간 점만 뺐다.
 * 로그아웃은 확인 없이 로그인 화면으로 간다(REQ-AUTH-005) — 세션 정리는 서버 연동 후.
 */
export function StudentSidebar({
  name,
  studentNumber,
  room,
  hasUnreadNotification,
}: StudentSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const onNotifications = pathname === "/notifications";

  return (
    <aside className="hidden h-dvh w-60 shrink-0 flex-col gap-1 border-r border-admin-border bg-admin-surface px-5 pb-6 pt-7 md:sticky md:top-0 md:flex">
      <div className="flex h-16 items-center rounded-card bg-admin-rowSurface p-3">
        <div className="flex flex-col gap-px leading-normal">
          <p className="text-sm font-bold text-admin-text">{name}</p>
          <p className="text-[11px] text-admin-textMuted">
            {studentNumber} · {room}
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
          highlighted={hasUnreadNotification || onNotifications}
          icon={
            hasUnreadNotification ? (
              // eslint-disable-next-line @next/next/no-img-element -- 빨간 점 색을 유지해야 해서 mask 대신 원본 SVG를 그대로 쓴다
              <img
                src="/icons/student-nav/bell-unread.svg"
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
        onClick={() => router.push("/login")}
        className="flex items-center gap-2.5 rounded-control bg-admin-danger-bg px-3 py-[11px] text-sm leading-normal text-admin-danger-text"
      >
        <MaskIcon src="/icons/student-nav/logout.svg" className="size-[18px]" />
        로그아웃
      </button>
    </aside>
  );
}
