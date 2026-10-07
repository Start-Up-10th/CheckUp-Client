"use client";

import { useEffect, useRef } from "react";
import { fetchCurrentMember } from "@/lib/auth/auth-api";
import { homePathFor } from "@/lib/auth/home-path";
import { takeQrReturnUrl } from "@/lib/student/qr-return-url";

/**
 * 로그인 완료(REQ-AUTH-001·004, REQ-ATT-005). 서버 DataGSM 콜백이 로그인을 마치고 돌려보내는 곳이다
 * (서버 CheckUp-server#53). 세션을 `/api/v1/auth/me`로 확인해 보낸다.
 * - 로그인 안 됨·서버 오류 → `/login?error=1`(로그인 실패 문구)
 * - 관리자 권한 계정(기숙사 자치위원 포함)은 어느 로그인으로 들어왔든 `/admin`으로 간다(DEC-055). 관리자는 사용자 앱을 쓰지 않고 QR 출석도 하지 않는다.
 * - QR 링크로 왔다가 로그인하러 갔으면 → 저장해 둔 `/qr#t=<토큰>`으로 돌아가 출석을 이어간다.
 * - 그 밖에는 동의 여부로 정한 첫 화면(`homePathFor`: 동의 안 한 학생 `/consent`, 동의한 학생 `/main`). 얼굴 미등록 학생은 홈이 얼굴 등록으로 보낸다(REQ-UI-003).
 * 페이지째 이동(`location.replace`)해서 뒤로가기로 이 화면에 돌아오지 않게 하고, QR 주소의 `#t=`를
 * QR 화면이 처음 열릴 때 읽게 한다. 이 화면 디자인은 Figma에 없어 로그인 화면과 같은 배경만 둔다.
 */
export function StudentLoginComplete() {
  // React 개발 모드(Strict Mode)에서 effect가 두 번 돌아도 한 번만 처리한다.
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    fetchCurrentMember()
      .then((member) => {
        if (!member) return "/login?error=1";
        if (member.role === "ADMIN") return "/admin";
        return takeQrReturnUrl() ?? homePathFor(member);
      })
      .catch(() => "/login?error=1")
      .then((next) => window.location.replace(next));
  }, []);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f5f5f7] md:bg-admin-bg">
      <p role="status" className="sr-only">
        로그인하는 중
      </p>
    </main>
  );
}
