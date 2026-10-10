"use client";

import { useEffect } from "react";
import { ToastLayer, useToast } from "@/components/admin/Toast";
import { CameraPanel } from "@/components/admin/CameraPanel";
import { successMessage } from "@/lib/admin/face-results";
import { useFaceRecognition } from "@/lib/admin/use-face-recognition";
import { RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { useCameraStream } from "@/lib/admin/use-camera-stream";
import type { Purpose } from "@/lib/admin/purpose";

/** 용도 탭이 없어서(Figma 2026-10-06, DEC-036) 얼굴 인식은 기숙사 용도로 고정한다. */
const PURPOSE: Purpose = "dorm";

/** 인식에 실패한 순간 위쪽 가운데 토스트로 잠깐 보이는 문구. 신원을 붙이지 않는다(REQ-FACE-005). */
const FAILURE_MESSAGE = "인식 실패";

/** 인식 서버에 연결하지 못했을 때(다시 시도 버튼과 함께 보인다). */
const SERVER_FAILED_MESSAGE = "불러오지 못했어요";

/** REQ-FACE-006 문구. 서버가 한 얼굴의 인식을 반복해 놓쳤다고(qrRecommended) 알릴 때 보인다. */
const QR_NOTICE_MESSAGE = "인식 실패 · 3회 초과 시 QR로 출석";

/**
 * REQ-FACE-004: 진입하면 카메라가 자동으로 켜지고 인식 세션이 시작된다. 페이지를 벗어나면 정리된다.
 * 화면은 카메라 패널 하나다. 용도 탭·전체화면·최근 인식 목록은 없다(DEC-036).
 */
export function AdminFaceRecognition() {
  const { videoRef, status } = useCameraStream();
  const recognition = useFaceRecognition({
    videoRef,
    cameraReady: status === "granted",
    purpose: PURPOSE,
  });

  // 성공(`성공 · 학번 이름`)은 토스트로 잠깐 보인다(REQ-FACE-006·007). 카메라가 안 켜졌으면 서버 오류 토스트는 숨긴다.
  const { showToast } = useToast();
  const success = recognition.success;
  useEffect(() => {
    if (success) {
      showToast({ variant: "success", message: successMessage(success) });
    }
  }, [success, showToast]);
  const serverFailed = recognition.status === "error" && status !== "error";

  return (
    <div className="flex h-full w-full flex-col gap-3.5 px-4 py-3.5 md:gap-4 md:px-[22px] md:py-6 xl:gap-5 xl:px-8 xl:py-7">
      <div className="flex w-full items-center justify-between md:items-end">
        <div className="flex flex-col gap-1 md:gap-[3px] xl:gap-1">
          <p className="hidden font-mono text-[10px] tracking-[1.8px] text-admin-textFaint md:block md:leading-[13px] xl:text-[11px] xl:leading-[15px] xl:tracking-[1.98px]">
            FACE RECOGNITION
          </p>
          <h1 className="text-[22px] font-bold leading-[26px] tracking-[-0.44px] text-admin-text md:text-[26px] md:leading-[31px] md:tracking-[-0.78px] xl:text-[30px] xl:leading-[36px] xl:tracking-[-0.9px]">
            얼굴 인식 생성
          </h1>
        </div>
      </div>

      {/*
        모든 상태 메시지는 토스트(위쪽 가운데)로 보인다. 상태가 풀릴 때까지 유지하는 한 자리(`toast`)는 인식 서버 연결 실패
        (다시 시도 버튼) > QR 안내 > 인식 실패 > 429 `잠시 후 다시 시도` 순서로 하나만 보이고, 성공은 따로 잠깐 떴다 사라진다.
      */}
      <ToastLayer
        toast={
          serverFailed
            ? {
                variant: "error",
                message: SERVER_FAILED_MESSAGE,
                action: { label: "다시 시도", onClick: recognition.retry },
              }
            : recognition.qrNotice
              ? { variant: "error", message: QR_NOTICE_MESSAGE }
              : recognition.failure
                ? { variant: "error", message: FAILURE_MESSAGE }
                : recognition.rateLimited
                  ? { variant: "neutral", message: RATE_LIMIT_MESSAGE }
                  : null
        }
      />

      <div className="flex min-h-0 w-full flex-1">
        <CameraPanel videoRef={videoRef} status={status} />
      </div>
    </div>
  );
}
