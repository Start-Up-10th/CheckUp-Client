import type { Metadata, Viewport } from "next";
import { Roboto_Mono } from "next/font/google";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import "./globals.css";

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  title: "기숙사 출석 관리",
  description: "광주소프트웨어마이스터고 기숙사 입소·자습실 출석 관리 시스템",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "기숙사 출석",
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
    <html lang="ko">
      <body className={`${robotoMono.variable} font-sans`}>
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
