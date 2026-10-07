"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ToastLayer } from "@/components/admin/Toast";
import { useCurrentStudent } from "@/lib/student/current-student";
import { LogoutButton } from "./LogoutButton";
import { MenuRow } from "./MenuRow";
import { MyProfile } from "./MyProfile";
import { StudentShell } from "./StudentShell";

/**
 * 학생 마이페이지(REQ-UI-004). 핸드폰(Figma 6:2)은 흰 헤더 아래 메뉴, 맨 아래 로그아웃,
 * 하단 탭. 노트북(227:2)은 사이드바 오른쪽 영역 가운데(사용자 결정 — Figma는 30px 왼쪽으로
 * 치우침)에 폭 640px로 프로필 카드와 메뉴를 쌓는다. 오른쪽 영역이 640px보다 좁은 패드 폭에서는
 * 좌우 24px을 남기고 줄어든다(Figma에 없는 폭이라 작업자 기본값).
 *
 * 프로필(이름·학번·층·호실)은 공통 틀이 서버에서 받은 본인 정보(`/api/v1/auth/me`)다. 로그인하지 않았으면
 * 로그인 화면으로 보낸다. 받지 못하면 Figma 마이페이지 state messages(345:13, 345:48)의
 * `정보를 불러오지 못했습니다.`를 학생 홈 오류와 같은 자리(핸드폰 아래, 노트북 오른쪽 위)에 보여 준다.
 */
export function StudentMyPage() {
  return (
    <StudentShell>
      <StudentMyPageContent />
    </StudentShell>
  );
}

/** 공통 틀 안에서 본인 정보를 꺼내 쓰는 마이페이지 본문. */
function StudentMyPageContent() {
  const router = useRouter();
  const current = useCurrentStudent();

  useEffect(() => {
    if (current.status === "unauthenticated") router.replace("/login");
  }, [current.status, router]);

  return (
    <>
      <main className="flex flex-1 flex-col md:items-center md:px-6 md:pt-[90px]">
        <div className="flex flex-1 flex-col md:w-full md:max-w-[640px] md:flex-none md:gap-5">
          <MyProfile
            profile={current.status === "ready" ? current.profile : null}
          />
          <div className="flex flex-1 flex-col gap-2.5 px-[18px] py-4 md:flex-none md:p-0">
            <MenuRow href="/volunteer" label="봉사 활동" />
            <div className="flex-1 md:hidden" />
            <LogoutButton />
          </div>
        </div>
      </main>
      <ToastLayer
        toast={
          current.status === "error"
            ? { variant: "error", message: "정보를 불러오지 못했습니다." }
            : null
        }
      />
    </>
  );
}
