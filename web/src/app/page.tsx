import { RootRedirect } from "@/components/RootRedirect";

// 앱 첫 화면 — 로그인 상태에 따라 첫 화면으로 보낸다(DEC-001, PWA start_url).
export default function RootPage() {
  return <RootRedirect />;
}
