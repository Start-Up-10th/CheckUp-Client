import type { MetadataRoute } from "next";

/**
 * 설치 가능한 앱 셸만 지원한다(2026-09-23 사용자 결정, DEC-024).
 * 오프라인 데이터 열람·얼굴 인식은 이 범위에 없다(DEC-005는 별개 검증 항목).
 * 관리자는 별도 manifest(app/admin/manifest.webmanifest/route.ts)로 분리했다(DEC-025) — 이 manifest는
 * 학생 앱이다. 학생 화면은 `app/(user)/` route group이라 주소 앞에 접두사가 없다(`/main`, `/login` …).
 * start_url `/`는 앱 첫 화면(RootRedirect)이 로그인 상태에 따라 학생 홈·동의·로그인으로 보낸다.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "기숙사 출석 관리",
    short_name: "기숙사 출석",
    description: "광주소프트웨어마이스터고 기숙사 입소·자습실 출석 관리 시스템",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f2f2f3",
    theme_color: "#b9ee84",
    lang: "ko",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
