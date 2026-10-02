"use client";

import { useEffect, useRef, useState } from "react";
import { StatusBanner } from "@/components/admin/StatusBanner";
import { PurposeTabs } from "@/components/admin/PurposeTabs";
import { CameraPanel } from "@/components/admin/CameraPanel";
import { RecentRecognitionsList } from "@/components/admin/RecentRecognitionsList";
import { successMessage } from "@/lib/admin/face-results";
import { useFaceRecognition } from "@/lib/admin/use-face-recognition";
import { useCameraStream } from "@/lib/admin/use-camera-stream";
import type { Purpose } from "@/lib/admin/purpose";

const DEFAULT_PURPOSE: Purpose = "dorm";

/** REQ-FACE-006 문구. 서버가 한 얼굴의 인식을 반복해 놓쳤다고(qrRecommended) 알릴 때 보인다. */
/** 인식에 실패한 순간 카메라 하단에 잠깐 보이는 문구. 신원을 붙이지 않는다(REQ-FACE-005). */
const FAILURE_MESSAGE = "인식 실패";

const QR_NOTICE_MESSAGE = "인식 실패 · 3회 초과 시 QR로 출석";

/**
 * REQ-FACE-004: 목적 탭 변경은 기존 처리와 분리해 새 목적에 적용할 뿐, 카메라 자체를 다시 열지 않는다.
 * 얼굴 인식 세션만 용도마다 새로 만든다(서버 세션은 탭을 바꾸면 이전 것을 종료한다).
 * REQ-FACE-007: 전체화면 전환은 표시 모드 변경일 뿐이다 — useCameraStream을 이 컨테이너에서 한 번만
 * 불러서 같은 video 엘리먼트를 정상/전체화면 모두에서 그대로 재사용한다.
 */
export function AdminFaceRecognition() {
  const [purpose, setPurpose] = useState<Purpose>(DEFAULT_PURPOSE);
  const { videoRef, status } = useCameraStream();
  const recognition = useFaceRecognition({
    videoRef,
    cameraReady: status === "granted",
    purpose,
  });
  const recentEntries = recognition.entries;
  const recentStatus = recognition.status === "error" ? "error" : "ready";
  // 폰은 빈·오류 상태에서 카메라 패널을 숨기고 최근 인식 패널이 전체 높이를 쓴다(Figma 관리자-핸드폰).
  const recentFillsScreen =
    recentStatus === "error" ||
    (recentStatus === "ready" && recentEntries.length === 0);
  const panelWrapperRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === panelWrapperRef.current);
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  function enterFullscreen() {
    panelWrapperRef.current?.requestFullscreen();
  }

  function exitFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
  }

  return (
    <div className="flex min-h-full w-full flex-col gap-3.5 px-4 py-3.5 md:h-full md:gap-4 md:px-[22px] md:py-6">
      <div className="flex w-full items-center justify-between md:items-end">
        <div className="flex flex-col gap-1">
          <p className="hidden font-mono text-[10px] tracking-[1.8px] text-admin-textFaint md:block xl:text-[11px] xl:tracking-[1.98px]">
            FACE RECOGNITION
          </p>
          <h1 className="text-[22px] font-bold leading-[26px] tracking-[-0.44px] text-admin-text md:text-[26px] md:leading-normal md:tracking-[-0.78px] xl:text-[30px] xl:tracking-[-0.9px]">
            얼굴 인식 생성
          </h1>
        </div>
        <PurposeTabs
          selected={purpose}
          onSelect={setPurpose}
          labels={{ dorm: "기숙사 입소" }}
          compactLabels={{ dorm: "기숙사" }}
        />
      </div>

      {recognition.qrNotice && (
        <StatusBanner
          variant="error"
          message={QR_NOTICE_MESSAGE}
          compactOnPhone
          className="w-fit"
        />
      )}

      <div className="flex w-full flex-1 flex-col gap-3.5 md:min-h-0 md:gap-4 xl:flex-row">
        <div
          ref={panelWrapperRef}
          className={`flex min-h-[240px] w-full flex-1 md:min-h-0 xl:block xl:h-auto xl:min-w-0 xl:flex-[910] ${
            recentFillsScreen ? "max-md:hidden" : ""
          }`}
        >
          <CameraPanel
            videoRef={videoRef}
            status={status}
            isFullscreen={isFullscreen}
            failureMessage={recognition.failure ? FAILURE_MESSAGE : null}
            successMessage={
              recognition.success ? successMessage(recognition.success) : null
            }
            onEnterFullscreen={enterFullscreen}
            onExitFullscreen={exitFullscreen}
          />
        </div>
        <RecentRecognitionsList
          entries={recentEntries}
          status={recentStatus}
          onRetry={recognition.retry}
        />
      </div>
    </div>
  );
}
