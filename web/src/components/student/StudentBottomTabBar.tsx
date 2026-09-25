"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaskIcon } from "./MaskIcon";

const TABS = [
  { href: "/main", label: "홈", iconSrc: "/icons/student-tab/home.svg" },
  { href: "/my", label: "마이페이지", iconSrc: "/icons/student-tab/my.svg" },
];

/**
 * REQ-UI-004: 학생 핸드폰 하단 탭(홈/마이 2개, 라벨 없이 아이콘만). 지금 화면을 초록으로 강조한다.
 * Figma 6:32 — 아이콘 24px, 좌우 80px 여백. Figma는 아이콘이 칸(24×26) 밖으로 2~3px 밀려
 * 있으나 칸 가운데로 맞췄다(사용자 결정). 누르는 영역은 음수 margin으로 넓혀 위치는 그대로 둔다.
 */
export function StudentBottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-[#dfdfe1] bg-[#ededee] px-20 pb-[22px] pt-[18px] md:hidden">
      {TABS.map(({ href, label, iconSrc }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={`-m-3 flex h-[50px] w-12 items-center justify-center ${
              active ? "text-admin-attendance-text" : "text-admin-textFaint"
            }`}
          >
            <MaskIcon src={iconSrc} className="size-6" />
          </Link>
        );
      })}
    </nav>
  );
}
