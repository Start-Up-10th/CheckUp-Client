"use client";

import { createContext, useContext } from "react";
import {
  closeFaceSession,
  createFaceSession,
  sendFaceFrame,
  type FaceFrameResult,
} from "@/lib/admin/face-api";
import type { Purpose } from "@/lib/admin/purpose";

/**
 * 얼굴 인식 화면이 서버와 주고받는 동작 모음이다. 기본은 실제 서버 API이고, 로그인 없이 보는 확인용 페이지와
 * 테스트는 Provider로 다른 구현을 넣는다.
 */
export type FaceGateway = {
  createSession: (purpose: Purpose) => Promise<string>;
  closeSession: (sessionId: string) => void;
  sendFrame: (
    sessionId: string,
    frame: Blob,
    frameId: string,
  ) => Promise<FaceFrameResult>;
};

export const apiFaceGateway: FaceGateway = {
  createSession: createFaceSession,
  closeSession: closeFaceSession,
  sendFrame: sendFaceFrame,
};

const FaceGatewayContext = createContext<FaceGateway>(apiFaceGateway);

export const FaceGatewayProvider = FaceGatewayContext.Provider;

export function useFaceGateway(): FaceGateway {
  return useContext(FaceGatewayContext);
}
