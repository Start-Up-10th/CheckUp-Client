import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "기숙사 출석 관리",
  description: "기숙사 얼굴 인식·QR 출석 관리",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
