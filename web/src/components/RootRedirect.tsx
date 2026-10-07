"use client";

import { useEffect, useRef } from "react";
import { fetchCurrentMember } from "@/lib/auth/auth-api";
import { homePathFor } from "@/lib/auth/home-path";

/**
 * 앱 첫 화면(`/`). 설치한 사용자 앱(PWA, start_url `/`)을 열거나 주소만 치고 들어오면 여기로 온다(관리자 앱은 `/admin`).
 * 기숙사 자치위원(관리자이면서 학생)도 여기로 들어오면 학생 화면으로 간다(DEC-047).
 * 세션을 `/api/v1/auth/me`로 확인해 이미 로그인했으면 역할·동의 여부의 첫 화면(`homePathFor`)으로,
 * 로그인하지 않았거나 확인이 실패하면 로그인 화면으로 보낸다. 로그인할 때마다 버튼을 다시 누르지 않게 한다.
 * 페이지째 이동(`location.replace`)해 뒤로가기로 이 화면에 돌아오지 않게 한다. 이 화면 디자인은 Figma에 없어
 * 로그인 완료 화면처럼 배경만 둔다.
 */
export function RootRedirect() {
  // React 개발 모드(Strict Mode)에서 effect가 두 번 돌아도 한 번만 처리한다.
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    fetchCurrentMember()
      .then((member) => (member ? homePathFor(member, "user") : "/login"))
      .catch(() => "/login")
      .then((next) => window.location.replace(next));
  }, []);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f5f5f7] md:bg-admin-bg">
      <p role="status" className="sr-only">
        불러오는 중
      </p>
    </main>
  );
}
