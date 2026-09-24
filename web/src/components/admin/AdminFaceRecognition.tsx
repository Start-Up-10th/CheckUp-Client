"use client";

import { useEffect, useRef, useState } from "react";
import { PurposeTabs } from "@/components/admin/PurposeTabs";
import { CameraPanel } from "@/components/admin/CameraPanel";
import { RecentRecognitionsList } from "@/components/admin/RecentRecognitionsList";
import { useCameraStream } from "@/lib/admin/use-camera-stream";
import { MOCK_RECENT_RECOGNITIONS } from "@/lib/admin/mock-recent-recognitions";
import type { Purpose } from "@/lib/admin/purpose";

const DEFAULT_PURPOSE: Purpose = "dorm";

/**
 * REQ-FACE-004: 목적 탭 변경은 기존 처리와 분리해 새 목적에 적용할 뿐, 카메라 자체를 다시 열지 않는다.
 * REQ-FACE-007: 전체화면 전환은 표시 모드 변경일 뿐이다 — useCameraStream을 이 컨테이너에서 한 번만
 * 불러서 같은 video 엘리먼트를 정상/전체화면 모두에서 그대로 재사용한다.
 */
export function AdminFaceRecognition() {
  const [purpose, setPurpose] = useState<Purpose>(DEFAULT_PURPOSE);
  const { videoRef, status } = useCameraStream();
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
    <div className="flex min-h-full w-full flex-col gap-3.5 px-4 py-3.5 md:h-full md:gap-5 md:px-8 md:py-7">
      <div className="flex w-full items-center justify-between md:items-end">
        <div className="flex flex-col gap-1">
          <p className="hidden font-mono text-[11px] tracking-[1.98px] text-admin-textFaint md:block">
            FACE RECOGNITION
          </p>
          <h1 className="text-[22px] font-bold leading-[26px] tracking-[-0.44px] text-admin-text md:text-[30px] md:leading-normal md:tracking-[-0.9px]">
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

      <div className="flex w-full flex-1 flex-col gap-3.5 md:min-h-0 md:flex-row md:gap-5">
        <div
          ref={panelWrapperRef}
          className="flex min-h-[240px] w-full flex-1 md:block md:h-auto md:min-h-0 md:min-w-0 md:flex-[910]"
        >
          <CameraPanel
            videoRef={videoRef}
            status={status}
            isFullscreen={isFullscreen}
            onEnterFullscreen={enterFullscreen}
            onExitFullscreen={exitFullscreen}
          />
        </div>
        <RecentRecognitionsList entries={MOCK_RECENT_RECOGNITIONS} />
      </div>
    </div>
  );
}
