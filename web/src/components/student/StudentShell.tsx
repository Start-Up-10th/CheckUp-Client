import { MOCK_STUDENT } from "@/lib/student/mock-student";
import { StudentBottomTabBar } from "./StudentBottomTabBar";
import { StudentSidebar } from "./StudentSidebar";

type StudentShellProps = {
  children: React.ReactNode;
  /** 핸드폰 하단 탭(홈/마이)을 보일지. QR·봉사·알림 화면은 숨긴다(REQ-UI-004). */
  showTabBar?: boolean;
};

/**
 * 학생 화면 공통 틀. 노트북(md 이상)은 왼쪽 사이드바, 핸드폰은 하단 탭바를 붙인다.
 * 하단 탭바는 화면에 고정(fixed)이라 그 높이(위 18 + 아이콘 26 + 테두리 1 = 45px에 아래 여백
 * max(22px, safe-area)를 더한 값, 보통 67px)만큼 내용 아래를 비운다. 동의·얼굴 등록·로그인 화면은 이 틀 없이 쓴다.
 */
export function StudentShell({
  children,
  showTabBar = true,
}: StudentShellProps) {
  const student = MOCK_STUDENT;

  return (
    <div className="flex min-h-dvh bg-admin-bg">
      <StudentSidebar
        name={student.name}
        studentNumber={student.studentNumber}
        room={`${student.roomNumber}호`}
        hasUnreadNotification={student.hasUnreadNotification}
      />
      <div
        className={`flex min-w-0 flex-1 flex-col ${
          showTabBar
            ? "pb-[calc(45px_+_max(22px,env(safe-area-inset-bottom)))] md:pb-0"
            : ""
        }`}
      >
        {children}
      </div>
      {showTabBar && <StudentBottomTabBar />}
    </div>
  );
}
