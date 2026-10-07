"use client";

import { ToastLayer } from "@/components/admin/Toast";
import { CameraPanel } from "@/components/admin/CameraPanel";
import { successMessage } from "@/lib/admin/face-results";
import { useFaceRecognition } from "@/lib/admin/use-face-recognition";
import { RATE_LIMIT_MESSAGE } from "@/lib/admin/rate-limit";
import { useCameraStream } from "@/lib/admin/use-camera-stream";
import type { Purpose } from "@/lib/admin/purpose";

/** 용도 탭이 없어서(Figma 2026-10-06, DEC-036) 얼굴 인식은 기숙사 용도로 고정한다. */
const PURPOSE: Purpose = "dorm";

/** 인식에 실패한 순간 위쪽 가운데 토스트로 잠깐 보이는 문구. 신원을 붙이지 않는다(REQ-FACE-005). */
const FAILURE_MESSAGE = "인식 실패";

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

      {/* 다른 화면의 토스트와 같은 위치·크기(위쪽 가운데)로 보인다. QR 안내가 먼저이고 인식 실패는 그 뒤에 보이며, 429(요청이 너무 많음)일 때는 `잠시 후 다시 시도` 안내를 보인다. */}
      <ToastLayer
        toast={
          recognition.qrNotice
            ? { variant: "error", message: QR_NOTICE_MESSAGE }
            : recognition.failure
              ? { variant: "error", message: FAILURE_MESSAGE }
              : recognition.rateLimited
                ? { variant: "neutral", message: RATE_LIMIT_MESSAGE }
                : null
        }
      />

      <div className="flex min-h-[240px] w-full flex-1 md:min-h-0">
        <CameraPanel
          videoRef={videoRef}
          status={status}
          successMessage={
            recognition.success ? successMessage(recognition.success) : null
          }
          recognitionFailed={recognition.status === "error"}
          onRetry={recognition.retry}
        />
      </div>
    </div>
  );
}
