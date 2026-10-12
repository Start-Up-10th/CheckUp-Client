// 학생 얼굴 등록 화면 — docs/spec/face.md REQ-FACE-001. `?reset=1`은 마이페이지 `얼굴 재설정`으로 들어온 다시 등록이다.
import { StudentFaceCapture } from "@/components/student/StudentFaceCapture";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const { reset } = await searchParams;
  return <StudentFaceCapture mode={reset === "1" ? "reset" : "enroll"} />;
}
