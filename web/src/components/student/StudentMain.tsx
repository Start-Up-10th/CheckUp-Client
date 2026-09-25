"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { StatusBanner } from "@/components/admin/StatusBanner";
import { MOCK_MY_ROOM } from "@/lib/student/mock-room";
import { MOCK_STUDENT } from "@/lib/student/mock-student";
import { MainHeader } from "./MainHeader";
import { MyRoomCard } from "./MyRoomCard";
import { QrFab } from "./QrFab";
import { StudentShell } from "./StudentShell";

export type MainLoadStatus = "ready" | "error";

/**
 * 학생 홈(REQ-UI-003). 핸드폰(Figma 5:2)은 흰 헤더 아래 `내 호실` 카드가 하단 탭 위까지 차고,
 * 오른쪽 아래 QR 버튼. 노트북(224:2)은 사이드바 오른쪽 가운데 폭 720px·안쪽 여백 36px에 머리와 카드.
 * 얼굴 미등록이면 얼굴 등록(/face)으로 보낸다. 서버 실패는 `서버와 연결이 원활하지 않습니다.`
 * (Figma state messages 205:263 — 관리자 StatusBanner error와 같은 모양이라 재사용).
 * 메인 토스트 프레임이 Figma에서 지워져 위치는 이전 프레임 값을 따르되, 핸드폰은 QR 버튼과 겹치지
 * 않게 그 위(아래 176px)에 둔다. 노트북은 이전 프레임대로 오른쪽 위 32px, 폭 380px.
 * 조회 API가 없어 실패는 `initialStatus`로만 연다(기본 ready). "지금은 출석 인증을 받고 있지
 * 않습니다."는 QR 결과 문구라 여기서는 쓰지 않는다.
 */
export function StudentMain({
  initialStatus = "ready",
}: {
  initialStatus?: MainLoadStatus;
}) {
  const router = useRouter();
  const student = MOCK_STUDENT;

  useEffect(() => {
    if (!student.faceRegistered) router.replace("/face");
  }, [student.faceRegistered, router]);

  return (
    <StudentShell>
      <main className="flex min-h-0 flex-1 flex-col md:items-center md:p-9">
        <div className="flex min-h-0 flex-1 flex-col md:w-full md:max-w-[720px] md:gap-5">
          <MainHeader
            name={student.name}
            studentNumber={student.studentNumber}
            floor={student.floor}
            hasUnreadNotification={student.hasUnreadNotification}
          />
          <div className="flex min-h-0 flex-1 flex-col px-[18px] py-4 md:p-0">
            <MyRoomCard
              floor={student.floor}
              roomNumber={student.roomNumber}
              students={MOCK_MY_ROOM}
            />
          </div>
        </div>
      </main>
      <QrFab />
      {initialStatus === "error" && (
        <div className="pointer-events-none fixed inset-x-[18px] bottom-[176px] z-40 md:inset-x-auto md:bottom-auto md:right-8 md:top-8 md:w-[380px]">
          <StatusBanner
            variant="error"
            message="서버와 연결이 원활하지 않습니다."
          />
        </div>
      )}
    </StudentShell>
  );
}
