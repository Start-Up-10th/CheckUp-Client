import { MOCK_STUDENT } from "@/lib/student/mock-student";
import { LogoutButton } from "./LogoutButton";
import { MenuRow } from "./MenuRow";
import { MyProfile } from "./MyProfile";
import { StudentShell } from "./StudentShell";

/**
 * 학생 마이페이지(REQ-UI-004). 핸드폰(Figma 6:2)은 흰 헤더 아래 메뉴, 맨 아래 로그아웃,
 * 하단 탭. 노트북(227:2)은 사이드바 오른쪽 영역 가운데(사용자 결정 — Figma는 30px 왼쪽으로
 * 치우침)에 폭 640px로 프로필 카드와 메뉴를 쌓는다. 오른쪽 영역이 640px보다 좁은 패드 폭에서는
 * 좌우 24px을 남기고 줄어든다(Figma에 없는 폭이라 작업자 기본값).
 * "정보를 불러오지 못했습니다" 오류(345:13, 345:48)는 서버 조회가 생기면 연결한다.
 */
export function StudentMyPage() {
  const student = MOCK_STUDENT;

  return (
    <StudentShell>
      <main className="flex flex-1 flex-col md:items-center md:px-6 md:pt-[90px]">
        <div className="flex flex-1 flex-col md:w-full md:max-w-[640px] md:flex-none md:gap-5">
          <MyProfile
            name={student.name}
            studentNumber={student.studentNumber}
            floor={student.floor}
            roomNumber={student.roomNumber}
          />
          <div className="flex flex-1 flex-col gap-2.5 px-[18px] py-4 md:flex-none md:p-0">
            <MenuRow href="/volunteer" label="봉사 활동" />
            <div className="flex-1 md:hidden" />
            <LogoutButton />
          </div>
        </div>
      </main>
    </StudentShell>
  );
}
