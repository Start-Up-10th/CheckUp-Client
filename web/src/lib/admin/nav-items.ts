import type { ComponentType, SVGProps } from "react";
import {
  FaceScanIcon,
  HomeIcon,
  PeopleIcon,
  QrCodeIcon,
  VolunteerIcon,
} from "@/components/icons/AdminNavIcons";

export type AdminNavItem = {
  href: string;
  label: string;
  /** 패드 레일(md)에서 아이콘 아래 표시하는 짧은 라벨(Figma 관리자-패드). */
  shortLabel: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /**
   * 핸드폰 메뉴 시트 아이콘(Figma 관리자-핸드폰 `공통 · 메뉴 시트` 원본 SVG)과 그 원본 크기(px). 홈은 하단 바에
   * 따로 있어 없다.
   */
  sheetIcon?: { src: string; size: number };
};

/**
 * REQ-UI-005: 메뉴는 홈/QR 코드 생성/얼굴 인식 생성/봉사자 관리/학생 관리이며, 반응형 3단계에서 메뉴 구성은 동일하다.
 * 핸드폰은 홈과 메뉴 시트로 나눠 보여 준다.
 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: "/admin",
    label: "홈",
    shortLabel: "홈",
    icon: HomeIcon,
  },
  {
    href: "/admin/qr",
    label: "QR 코드 생성",
    shortLabel: "QR",
    icon: QrCodeIcon,
    sheetIcon: { src: "/icons/menu/qr.svg", size: 20 },
  },
  {
    href: "/admin/face",
    label: "얼굴 인식 생성",
    shortLabel: "얼굴",
    icon: FaceScanIcon,
    sheetIcon: { src: "/icons/menu/face.svg", size: 20 },
  },
  {
    href: "/admin/volunteers",
    label: "봉사자 관리",
    shortLabel: "봉사",
    icon: VolunteerIcon,
    sheetIcon: { src: "/icons/menu/volunteer.svg", size: 20.8291 },
  },
  {
    href: "/admin/students",
    label: "학생 관리",
    shortLabel: "학생",
    icon: PeopleIcon,
    sheetIcon: { src: "/icons/menu/students.svg", size: 20 },
  },
];

export function isAdminNavActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
