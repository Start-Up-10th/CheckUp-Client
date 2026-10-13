// 개인정보 동의 화면 — docs/spec/identity.md REQ-AUTH-004
// `?reset=1&from=admin`은 관리자 마이페이지 `얼굴 등록`에서 시작한 흐름이다(REQ-FACE-001). 동의 뒤 촬영 화면에 그대로 넘긴다.
import { StudentConsent } from "@/components/student/StudentConsent";
import { parseFaceFlow } from "@/lib/student/face-flow";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; from?: string }>;
}) {
  const flow = parseFaceFlow(await searchParams);
  return <StudentConsent flow={flow} />;
}
