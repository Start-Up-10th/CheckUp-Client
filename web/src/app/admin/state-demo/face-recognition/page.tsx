import { AdminFaceRecognition } from "@/components/admin/AdminFaceRecognition";
import { MockFaceProvider } from "../_components/MockFaceProvider";

// 로그인 없이 얼굴 인식 화면 본문만 보는 확인용 페이지(사이드바 없음). 인식 결과는 정해진 목업이다.
export default function Page() {
  return (
    <div className="h-screen w-full bg-admin-bg">
      <MockFaceProvider>
        <AdminFaceRecognition />
      </MockFaceProvider>
    </div>
  );
}
