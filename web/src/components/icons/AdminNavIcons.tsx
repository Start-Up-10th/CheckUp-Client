import type { SVGProps } from "react";

/**
 * Figma `관리자-컴퓨터` 사이드바 아이콘 (node-id 16:411/16:418/16:425/318:9/61:8).
 * 원본 export의 stroke 색상만 currentColor로 바꿔 active/inactive 상태를 CSS로 제어한다.
 */
export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M2.625 7.95L9 3L15.375 7.95V15C15.375 15.1989 15.296 15.3897 15.1553 15.5303C15.0147 15.671 14.8239 15.75 14.625 15.75H3.375C3.17609 15.75 2.98532 15.671 2.84467 15.5303C2.70402 15.3897 2.625 15.1989 2.625 15V7.95Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 15.75V12.3H10.5V15.75"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function QrCodeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M3 6.75V3.75C3 3.55109 3.07902 3.36032 3.21967 3.21967C3.36032 3.07902 3.55109 3 3.75 3H6.75M11.25 3H14.25C14.4489 3 14.6397 3.07902 14.7803 3.21967C14.921 3.36032 15 3.55109 15 3.75V6.75M15 11.25V14.25C15 14.4489 14.921 14.6397 14.7803 14.7803C14.6397 14.921 14.4489 15 14.25 15H11.25M6.75 15H3.75C3.55109 15 3.36032 14.921 3.21967 14.7803C3.07902 14.6397 3 14.4489 3 14.25V11.25"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 6.75H7.5C7.08579 6.75 6.75 7.08579 6.75 7.5V10.5C6.75 10.9142 7.08579 11.25 7.5 11.25H10.5C10.9142 11.25 11.25 10.9142 11.25 10.5V7.5C11.25 7.08579 10.9142 6.75 10.5 6.75Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FaceScanIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M2.25 6V4.125C2.25 3.62772 2.44754 3.15081 2.79917 2.79917C3.15081 2.44754 3.62772 2.25 4.125 2.25H6M12 2.25H13.875C14.3723 2.25 14.8492 2.44754 15.2008 2.79917C15.5525 3.15081 15.75 3.62772 15.75 4.125V6M15.75 12V13.875C15.75 14.3723 15.5525 14.8492 15.2008 15.2008C14.8492 15.5525 14.3723 15.75 13.875 15.75H12M6 15.75H4.125C3.62772 15.75 3.15081 15.5525 2.79917 15.2008C2.44754 14.8492 2.25 14.3723 2.25 13.875V12"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 10.2C10.077 10.2 10.95 9.32696 10.95 8.25C10.95 7.17304 10.077 6.3 9 6.3C7.92304 6.3 7.05 7.17304 7.05 8.25C7.05 9.32696 7.92304 10.2 9 10.2Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 12.75C6.26325 12.1756 6.68589 11.6888 7.21769 11.3475C7.7495 11.0062 8.36811 10.8248 9 10.8248C9.63189 10.8248 10.2505 11.0062 10.7823 11.3475C11.3141 11.6888 11.7368 12.1756 12 12.75"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function VolunteerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M9 15.375C9 15.375 3.375 11.925 1.8 8.475C0.75 6 1.8 3.6 4.2 3.075C5.7 2.775 7.125 3.45 7.875 4.725C8.625 3.45 10.05 2.775 11.55 3.075C13.95 3.6 15 6 13.95 8.475C12.375 11.925 6.75 15.375 6.75 15.375H9Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Figma User / Users (1289:63) — 학생 관리. 두 사람 모양이고 선 두께는 1.3이다. */
export function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M15.75 14.9999C15.75 13.6937 14.4978 12.5825 12.75 12.1707M11.25 15C11.25 13.3431 9.23528 12 6.75 12C4.26472 12 2.25 13.3431 2.25 15M11.25 9.75C12.9069 9.75 14.25 8.40685 14.25 6.75C14.25 5.09315 12.9069 3.75 11.25 3.75M6.75 9.75C5.09315 9.75 3.75 8.40685 3.75 6.75C3.75 5.09315 5.09315 3.75 6.75 3.75C8.40685 3.75 9.75 5.09315 9.75 6.75C9.75 8.40685 8.40685 9.75 6.75 9.75Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Figma 관리자 사이드바 마이페이지 아이콘(1289:66, 19px) — 한 사람 모양. */
export function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 19 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M9.5 9.65833C11.1615 9.65833 12.5083 8.31146 12.5083 6.65C12.5083 4.98854 11.1615 3.64167 9.5 3.64167C7.83854 3.64167 6.49167 4.98854 6.49167 6.65C6.49167 8.31146 7.83854 9.65833 9.5 9.65833Z"
        stroke="currentColor"
        strokeWidth="1.425"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.8 16.15C3.8 14.6383 4.40053 13.1884 5.46949 12.1195C6.53845 11.0505 7.98827 10.45 9.5 10.45C11.0117 10.45 12.4616 11.0505 13.5305 12.1195C14.5995 13.1884 15.2 14.6383 15.2 16.15"
        stroke="currentColor"
        strokeWidth="1.425"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Figma icon/bell (469:1055) — 알림 벨. 뱃지 점은 사용 측에서 overlay로 추가한다. */
export function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M11 2.75C7.55 2.75 4.75 5.55 4.75 9V14.5L3 16.25H19L17.25 14.5V9C17.25 5.55 14.45 2.75 11 2.75Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 16.25C9 17.355 9.895 18.25 11 18.25C12.105 18.25 13 17.355 13 16.25"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LogoutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M11.25 3H13.5C13.8978 3 14.2794 3.15804 14.5607 3.43934C14.842 3.72064 15 4.10218 15 4.5V13.5C15 13.8978 14.842 14.2794 14.5607 14.5607C14.2794 14.842 13.8978 15 13.5 15H11.25"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 5.25L3.75 9L7.5 12.75M3.75 9H11.25"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
