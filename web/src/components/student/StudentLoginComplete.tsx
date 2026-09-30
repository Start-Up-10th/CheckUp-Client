"use client";

import { useEffect, useRef } from "react";
import { fetchCurrentMember } from "@/lib/auth/auth-api";
import { takeQrReturnUrl } from "@/lib/student/qr-return-url";

/**
 * 로그인 완료(REQ-AUTH-001·004, REQ-ATT-005). 서버 DataGSM 콜백이 로그인을 마치고 돌려보내는 곳이다
 * (서버 CheckUp-server#53). 세션을 `/api/v1/auth/me`로 확인해 보낸다.
 * - 로그인 안 됨·서버 오류 → `/login?error=1`(로그인 실패 문구)
 * - QR 링크로 왔다가 로그인하러 갔으면 → 역할과 상관없이 저장해 둔 `/qr#t=<토큰>`으로 돌아가 출석을 이어간다.
 *   기숙사 자치위원은 서버에서 관리자(`ADMIN`)이면서 학생이라 QR 출석 대상이다. 학생 여부는 스캔 API가 판정한다.
 * - 관리자 → `/admin`
 * - 아직 동의하지 않은 학생 → 최초 이용 순서의 다음 화면 `/consent`
 * - 이미 동의한 학생 → 학생 홈 `/main`. 서버 `/me`에 얼굴 등록 여부가 아직 없어 `/face`로는 나누지 못한다
 *   (얼굴 미등록 학생은 홈이 등록 화면으로 보낸다, REQ-AUTH-004).
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
        const qrReturnUrl = takeQrReturnUrl();
        if (qrReturnUrl) return qrReturnUrl;
        if (member.role === "ADMIN") return "/admin";
        return member.consented ? "/main" : "/consent";
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
