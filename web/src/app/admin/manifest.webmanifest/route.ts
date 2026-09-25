import { NextResponse } from "next/server";
import type { MetadataRoute } from "next";

/**
 * 관리자 전용 manifest(DEC-025). Next.js의 manifest.ts 파일 컨벤션은 앱 루트에서만
 * 라우트로 인식되고 하위 세그먼트(app/admin/manifest.ts)에서는 동작하지 않아
 * (빌드는 되지만 404) route handler로 직접 만들었다. `/admin` 레이아웃 metadata의
 * `manifest` 필드가 이 경로를 가리킨다.
 *
 * 학생용 manifest(app/manifest.ts)와 아이콘 이미지는 같지만(실제 로고 없는 placeholder,
 * DEC-024) 이름·시작 경로·scope로 서로 다른 설치 항목임을 구분한다.
 */
const manifest: MetadataRoute.Manifest = {
  name: "기숙사 출석 관리 · 관리자",
  short_name: "관리자",
  description: "기숙사 출석 관리 시스템의 관리자용 화면",
  start_url: "/admin",
  scope: "/admin",
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

export function GET() {
  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
