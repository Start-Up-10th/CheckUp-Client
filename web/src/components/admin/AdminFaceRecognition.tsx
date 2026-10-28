"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaceFloorDialog } from "@/components/admin/FaceFloorDialog";
import { FloorTabs } from "@/components/admin/FloorTabs";
import { ToastLayer } from "@/components/admin/Toast";
import { CameraPanel } from "@/components/admin/CameraPanel";
import { RecentRecognitions } from "@/components/admin/RecentRecognitions";
import { useFaceRecognition } from "@/lib/admin/use-face-recognition";
import { RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { useCameraStream } from "@/lib/admin/use-camera-stream";
import type { Floor } from "@/lib/admin/floor-types";
import type { Purpose } from "@/lib/admin/purpose";

/** 용도 탭이 없어서(Figma 2026-10-06, DEC-036) 얼굴 인식은 기숙사 용도로 고정한다. */
const PURPOSE: Purpose = "dorm";

/** 인식 서버에 연결하지 못했을 때(다시 시도 버튼과 함께 보인다). */
const SERVER_FAILED_MESSAGE = "불러오지 못했어요";

/** REQ-FACE-006 문구. 서버가 한 얼굴의 인식을 반복해 놓쳤다고(qrRecommended) 알릴 때 보인다. */
const QR_NOTICE_MESSAGE = "인식 실패 · 3회 초과 시 QR로 출석";

type AdminFaceRecognitionProps = {
  /** 이 층으로 바로 들어간다. 없으면 층 선택 창을 먼저 보인다(DEC-100). */
  initialFloor?: Floor;
};

/**
 * 층 선택 창을 먼저 보이고, 층을 고르면 카메라 화면으로 들어간다(DEC-100). 창에서 취소하면 홈으로 돌아간다.
 * 층을 고르기 전에는 카메라를 켜지 않는다.
 */
export function AdminFaceRecognition({
  initialFloor,
}: AdminFaceRecognitionProps) {
  const router = useRouter();
  const [floor, setFloor] = useState<Floor | null>(initialFloor ?? null);

  if (floor === null) {
    return (
      <FaceFloorDialog
        onSelect={setFloor}
        onCancel={() => router.push("/admin")}
      />
    );
  }
  return <FaceRecognitionView floor={floor} onFloorChange={setFloor} />;
}

type FaceRecognitionViewProps = {
  floor: Floor;
  onFloorChange: (floor: Floor) => void;
};

/**
 * REQ-FACE-004: 진입하면 카메라가 자동으로 켜지고 인식 세션이 시작된다. 페이지를 벗어나면 정리된다.
 * 화면은 카메라 패널 하나와 오른쪽 위 층 탭이다. 층을 바꿔도 카메라·세션은 그대로다(서버 세션에 층이 없다, DEC-100).
 * 용도 탭·전체화면은 없다(DEC-036). 최근 인식 목록은 DEC-108.
 */
function FaceRecognitionView({
  floor,
  onFloorChange,
}: FaceRecognitionViewProps) {
  const { videoRef, status, mirrored } = useCameraStream();
  const recognition = useFaceRecognition({
    videoRef,
    cameraReady: status === "granted",
    purpose: PURPOSE,
    floor,
  });

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
        <FloorTabs selected={floor} onSelect={onFloorChange} />
      </div>

      {/*
        상태 안내는 토스트(위쪽 가운데)로 보인다. 상태가 풀릴 때까지 유지하는 한 자리는 인식 서버 연결 실패
        (다시 시도 버튼) > QR 안내 > 429 `잠시 후 다시 시도` 순서로 하나만 보인다. 성공·실패 결과는 최근 인식 목록에 남는다.
      */}
      <ToastLayer
        stacked={false}
        position="top-right"
        toast={
          serverFailed
            ? {
                variant: "error",
                message: SERVER_FAILED_MESSAGE,
                action: { label: "다시 시도", onClick: recognition.retry },
              }
            : recognition.qrNotice
              ? { variant: "error", message: QR_NOTICE_MESSAGE }
              : recognition.rateLimited
                ? { variant: "neutral", message: RATE_LIMIT_MESSAGE }
                : null
        }
      />

      <div className="flex min-h-0 w-full flex-1 flex-col gap-3.5 overflow-y-auto md:gap-4 xl:flex-row xl:gap-5">
        <div className="flex min-h-[240px] w-full flex-1">
          <CameraPanel
            videoRef={videoRef}
            status={status}
            mirrored={mirrored}
          />
        </div>
        <RecentRecognitions entries={recognition.recent} />
      </div>
    </div>
  );
}
