import { AdminMyPage } from "@/components/admin/AdminMyPage";

// `?face=done`은 관리자 얼굴 등록 흐름(동의 → 촬영)을 마치고 돌아온 것이다. 마이페이지가 성공 토스트를 한 번 보인다.
export default async function AdminMyPagePage({
  searchParams,
}: {
  searchParams: Promise<{ face?: string }>;
}) {
  const { face } = await searchParams;
  return <AdminMyPage faceDone={face === "done"} />;
}
