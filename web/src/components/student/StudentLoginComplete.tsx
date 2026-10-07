"use client";

import { useEffect, useRef } from "react";
import { fetchCurrentMember } from "@/lib/auth/auth-api";
import { homePathFor } from "@/lib/auth/home-path";
import { takeLoginApp } from "@/lib/auth/login-app";
import { takeQrReturnUrl } from "@/lib/student/qr-return-url";

/**
 * 로그인 완료(REQ-AUTH-001·004, REQ-ATT-005). 서버 DataGSM 콜백이 로그인을 마치고 돌려보내는 곳이다
 * (서버 CheckUp-server#53). 세션을 `/api/v1/auth/me`로 확인해 보낸다.
 * - 로그인 안 됨·서버 오류 → `/login?error=1`(로그인 실패 문구)
 * - QR 링크로 왔다가 로그인하러 갔으면 → 역할과 상관없이 저장해 둔 `/qr#t=<토큰>`으로 돌아가 출석을 이어간다.
 *   기숙사 자치위원은 서버에서 관리자(`ADMIN`)이면서 학생이라 QR 출석 대상이다. 학생 여부는 스캔 API가 판정한다.
 * - 그 밖에는 역할·동의 여부와 로그인을 시작한 앱으로 정한 첫 화면(`homePathFor`: 관리자 앱의 관리자와 학생 정보가
 *   없는 관리자 `/admin`, 동의 안 한 학생과 사용자 앱으로 들어온 기숙사 자치위원 `/consent`, 동의한 사람 `/main`). 얼굴 미등록 학생은 홈이 얼굴 등록으로 보낸다(REQ-UI-003).
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
        // 어느 앱에서 로그인을 시작했는지는 항상 읽어서 지운다(QR로 돌아가는 경우에도 남기지 않는다).
        const app = takeLoginApp();
        if (!member) return "/login?error=1";
        const qrReturnUrl = takeQrReturnUrl();
        if (qrReturnUrl) return qrReturnUrl;
        return homePathFor(member, app);
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
