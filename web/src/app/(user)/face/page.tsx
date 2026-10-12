// 학생 얼굴 등록 화면 — docs/spec/face.md REQ-FACE-001. `?reset=1`은 마이페이지 `얼굴 재설정`으로 들어온 다시 등록이다.
// `?from=admin`은 관리자 마이페이지의 `얼굴 등록`으로 들어온 것이라 끝나면 관리자 마이페이지로 돌아간다(REQ-UI-005).
import { StudentFaceCapture } from "@/components/student/StudentFaceCapture";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; from?: string }>;
}) {
  const { reset, from } = await searchParams;
  return (
    <StudentFaceCapture
      mode={reset === "1" ? "reset" : "enroll"}
      doneHref={from === "admin" ? "/admin/mypage" : "/main"}
    />
  );
}
