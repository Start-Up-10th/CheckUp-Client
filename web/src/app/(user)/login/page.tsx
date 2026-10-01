// 학생 로그인 화면 — docs/spec/identity.md REQ-AUTH-001
import { StudentLogin } from "@/components/student/StudentLogin";
import { loginFailureMessage } from "@/lib/auth/login-error";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return <StudentLogin failureMessage={loginFailureMessage(error)} />;
}
