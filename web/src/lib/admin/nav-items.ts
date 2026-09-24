import type { ComponentType, SVGProps } from "react";
import {
  FaceScanIcon,
  HomeIcon,
  QrCodeIcon,
  VolunteerIcon,
} from "@/components/icons/AdminNavIcons";

export type AdminNavItem = {
  href: string;
  label: string;
  /** 패드 레일(md)에서 아이콘 아래 표시하는 짧은 라벨(Figma 관리자-패드). */
  shortLabel: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** 휴대폰 하단 탭바용 아이콘(Figma 관리자-핸드폰 원본 SVG). 탭은 라벨 없이 아이콘만 표시한다(DEC-026). */
  tabIconSrc: string;
};

/** REQ-UI-005: 기본 메뉴는 홈/QR 코드 생성/얼굴 인식 생성/봉사자 관리이며, 반응형 3단계에서 메뉴 구성은 동일하다. */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: "/admin",
    label: "홈",
    shortLabel: "홈",
    icon: HomeIcon,
    tabIconSrc: "/icons/tab/home.svg",
  },
  {
    href: "/admin/qr",
    label: "QR 코드 생성",
    shortLabel: "QR",
    icon: QrCodeIcon,
    tabIconSrc: "/icons/tab/qr.svg",
  },
  {
    href: "/admin/face",
    label: "얼굴 인식 생성",
    shortLabel: "얼굴",
    icon: FaceScanIcon,
    tabIconSrc: "/icons/tab/face.svg",
  },
  {
    href: "/admin/volunteers",
    label: "봉사자 관리",
    shortLabel: "봉사",
    icon: VolunteerIcon,
    tabIconSrc: "/icons/tab/volunteer.svg",
  },
];

export function isAdminNavActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
