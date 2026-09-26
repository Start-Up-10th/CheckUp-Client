import type { MetadataRoute } from "next";

// 관리자 PWA 전용 manifest (DEC-025). 학생 manifest(app/manifest.ts)와 분리.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "기숙사 출석 관리 — 관리자",
    short_name: "출석 관리",
    description: "광주소프트웨어마이스터고 기숙사 출석 관리 관리자 화면",
    start_url: "/admin/login",
    scope: "/admin/",
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
