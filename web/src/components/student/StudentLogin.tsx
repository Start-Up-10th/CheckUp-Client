"use client";

import { useRouter } from "next/navigation";
import { StatusBanner } from "@/components/admin/StatusBanner";
import { DataGsmLoginButton } from "./DataGsmLoginButton";

/**
 * 학생 로그인(REQ-AUTH-001). Figma 사용자-핸드폰 3:21·사용자-노트북 222:2 — CHECKUP 로고와
 * `DataGSM으로 계속하기` 버튼뿐이다. 배경은 핸드폰 #f5f5f7, 노트북 #f2f2f3(Figma 값).
 * 로고(핸드폰 높이 45px, 노트북 61px)와 버튼 사이는 핸드폰 106px, 노트북 162px.
 * 둘을 한 묶음으로 화면 세로 가운데보다 핸드폰 127px, 노트북 112px 아래에 둔다(Figma 위치) —
 * 위 여백을 그 두 배(255px/225px)로 주고 남은 높이의 가운데에 놓는 방식이라 화면 높이가 달라도 비율이 유지된다.
 *
 * 실패 문구는 핸드폰 Figma state messages(3:42) 문구로 통일한다 — 노트북 Figma의
 * "계정 또는 비밀번호가 올바르지 않습니다."는 비밀번호 입력이 없는 REQ-AUTH-001과 맞지 않는다
 * (사용자 결정 2026-09-26). 위치는 Figma에 없어 핸드폰 아래 32px, 노트북 오른쪽 위 32px·폭 380px
 * (학생 홈 서버 오류와 같은 자리)로 둔다.
 */
export function StudentLogin({ failed = false }: { failed?: boolean }) {
  const router = useRouter();

  // TODO(REQ-AUTH-001, DEC-001): OAuth 연동 때 백엔드의 DataGSM 인가 시작 주소로 이동한다
  // (state·콜백 검증·토큰 교환은 백엔드). 실패하면 `/login?error=1`로 돌아오게 한다.
  // 지금은 화면 개발용으로 학생 최초 이용 흐름의 다음 화면(개인정보 동의)으로 보낸다.
  const login = () => router.push("/consent");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-[106px] bg-[#f5f5f7] px-4 pt-[255px] md:gap-[162px] md:bg-admin-bg md:pt-[225px]">
      <h1>
        {/* eslint-disable-next-line @next/next/no-img-element -- Figma 로고 이미지 원본 비율을 그대로 쓴다 */}
        <img
          src="/icons/login/checkup-logo.png"
          alt="CHECKUP"
          width={1600}
          height={422}
          className="h-[45px] w-auto md:h-[61px]"
        />
      </h1>
      <DataGsmLoginButton onClick={login} />
      {failed && (
        <div className="fixed inset-x-[18px] bottom-8 z-40 md:inset-x-auto md:bottom-auto md:right-8 md:top-8 md:w-[380px]">
          <StatusBanner
            variant="error"
            message="로그인에 실패했습니다. 다시 시도해 주세요."
          />
        </div>
      )}
    </main>
  );
}
