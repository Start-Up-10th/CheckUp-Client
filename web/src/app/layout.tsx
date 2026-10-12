import type { Metadata, Viewport } from "next";
import { Roboto_Mono } from "next/font/google";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { ThemeRouteSync } from "@/components/ThemeRouteSync";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  title: "CheckUp",
  description: "광주소프트웨어마이스터고 기숙사 입소·자습실 출석 관리 시스템",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CheckUp",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#b9ee84",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // data-theme은 아래 스크립트가 브라우저에서 붙여 서버가 그린 것과 다르다. 그 차이만 경고에서 뺀다.
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* 첫 화면을 그리기 전에 화면 모드를 정해 밝은 화면이 깜빡이지 않게 한다(REQ-UI-008). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${robotoMono.variable} font-sans`}>
        {children}
        <ThemeRouteSync />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
