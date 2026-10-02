"use client";

import { usePathname } from "next/navigation";
import { MOCK_STUDENT } from "@/lib/student/mock-student";
import {
  UnreadNotificationContext,
  useFetchUnreadNotification,
} from "@/lib/student/unread-notification";
import { StudentBottomTabBar } from "./StudentBottomTabBar";
import { StudentSidebar } from "./StudentSidebar";
import type { SidebarTone } from "./StudentSidebarLink";

type StudentShellProps = {
  children: React.ReactNode;
  /** 핸드폰 하단 탭(홈/마이)을 보일지. QR·봉사·알림 화면은 숨긴다(REQ-UI-004). */
  showTabBar?: boolean;
  /** 노트북 사이드바 색. QR 카메라 화면만 어두운 사이드바를 쓴다. */
  sidebarTone?: SidebarTone;
};

/**
 * 학생 화면 공통 틀. 노트북(md 이상)은 왼쪽 사이드바, 핸드폰은 하단 탭바를 붙인다.
 * 하단 탭바는 화면에 고정(fixed)이라 그 높이(위 18 + 아이콘 26 + 테두리 1 = 45px에 아래 여백
 * max(22px, safe-area)를 더한 값, 보통 67px)만큼 내용 아래를 비운다. 동의·얼굴 등록·로그인 화면은 이 틀 없이 쓴다.
 *
 * 읽지 않은 알림 여부(REQ-COM-005)는 틀이 화면에 들어올 때 서버에서 한 번 받아 노트북 사이드바 종에 쓰고,
 * 안쪽 화면(핸드폰 홈 종)에도 내려 준다. 알림 화면에서는 묻지 않고 없음으로 둔다 — 그 화면에 들어온 것이
 * 곧 확인이라 빨간 점을 해제하고, 알림 화면이 서버에 전체 읽음을 보낸다.
 */
export function StudentShell({
  children,
  showTabBar = true,
  sidebarTone = "light",
}: StudentShellProps) {
  const student = MOCK_STUDENT;
  const hasUnreadNotification = useFetchUnreadNotification(
    usePathname() !== "/notifications",
  );

  return (
    <div className="flex min-h-dvh bg-admin-bg">
      <StudentSidebar
        name={student.name}
        studentNumber={student.studentNumber}
        room={`${student.roomNumber}호`}
        hasUnreadNotification={hasUnreadNotification}
        tone={sidebarTone}
      />
      <div
        className={`flex min-w-0 flex-1 flex-col ${
          showTabBar
            ? "pb-[calc(45px_+_max(22px,env(safe-area-inset-bottom)))] md:pb-0"
            : ""
        }`}
      >
        <UnreadNotificationContext.Provider value={hasUnreadNotification}>
          {children}
        </UnreadNotificationContext.Provider>
      </div>
      {showTabBar && <StudentBottomTabBar />}
    </div>
  );
}
