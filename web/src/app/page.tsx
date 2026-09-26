import { redirect } from "next/navigation";

// 역할 분기(DEC-001) 전까지 관리자 로그인으로 리다이렉트한다.
export default function RootPage() {
  redirect("/admin/login");
}
