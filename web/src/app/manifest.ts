import type { MetadataRoute } from "next";

/**
 * 설치 가능한 앱 셸만 지원한다(2026-09-23 사용자 결정, DEC-022).
 * 오프라인 데이터 열람·얼굴 인식은 이 범위에 없다(DEC-005는 별개 검증 항목).
 * 관리자는 별도 manifest(app/admin/manifest.ts)로 분리했다(DEC-023) — 이 manifest는
 * 로그인 전 진입점과, 아직 구현되지 않은 학생 화면(추후 app/student 등)을 위한 것이다.
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
