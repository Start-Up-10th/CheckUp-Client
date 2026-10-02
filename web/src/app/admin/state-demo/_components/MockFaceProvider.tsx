"use client";

import type { ReactNode } from "react";
import { FaceGatewayProvider } from "@/lib/admin/face-gateway";
import { createMockFaceGateway } from "@/lib/admin/face-mock-gateway";

const MOCK_GATEWAY = createMockFaceGateway();

/**
 * 로그인·얼굴 인식 서버 없이 얼굴 인식 화면을 보는 확인용 페이지가 서버 대신 정해진 인식 결과(성공·실패·QR 안내)를
 * 쓰게 한다. 카메라는 브라우저 권한이 필요하다. 운영 화면에는 쓰지 않는다.
 */
export function MockFaceProvider({ children }: { children: ReactNode }) {
  return (
    <FaceGatewayProvider value={MOCK_GATEWAY}>{children}</FaceGatewayProvider>
  );
}
