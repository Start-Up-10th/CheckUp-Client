import Link from "next/link";

/**
 * DataGSM OAuth 로그인/역할 분기(DEC-001)가 아직 없어 임시로 둔 개발용 진입 화면이다.
 * 로그인 화면(REQ-UI 01)이 만들어지면 이 페이지를 대체한다.
 */
export default function RootPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 text-admin-text">
      <p className="text-sm text-admin-textMuted">
        개발용 진입 화면 (로그인 미구현)
      </p>
      <Link
        href="/admin"
        className="rounded-control bg-admin-attendance-bg px-6 py-3 text-sm font-bold text-admin-attendance-text"
      >
        관리자 홈으로 이동
      </Link>
    </main>
  );
}
