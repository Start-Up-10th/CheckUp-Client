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
  /** 휴대폰 하단 탭바용 축약 라벨 (REQ-UI-005: 홈 / QR / 얼굴 / 봉사). */
  shortLabel: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

/** REQ-UI-005: 기본 메뉴는 홈/QR 코드 생성/얼굴 인식 생성/봉사자 관리이며, 반응형 3단계에서 메뉴 구성은 동일하다. */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "홈", shortLabel: "홈", icon: HomeIcon },
  {
    href: "/admin/qr",
    label: "QR 코드 생성",
    shortLabel: "QR",
    icon: QrCodeIcon,
  },
  {
    href: "/admin/face",
    label: "얼굴 인식 생성",
    shortLabel: "얼굴",
    icon: FaceScanIcon,
  },
  {
    href: "/admin/volunteers",
    label: "봉사자 관리",
    shortLabel: "봉사",
    icon: VolunteerIcon,
  },
];

export function isAdminNavActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
