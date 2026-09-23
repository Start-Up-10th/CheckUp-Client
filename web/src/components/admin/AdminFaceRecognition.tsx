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
    <div className="flex h-full w-full flex-col gap-3.5 px-4 py-3.5 md:gap-5 md:px-8 md:py-7">
      <div className="flex w-full items-end justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-[11px] tracking-[1.98px] text-admin-textFaint">
            FACE RECOGNITION
          </p>
          <h1 className="text-[30px] font-bold tracking-[-0.9px] text-admin-text">
            얼굴 인식 생성
          </h1>
        </div>
        <PurposeTabs
          selected={purpose}
          onSelect={setPurpose}
          labels={{ dorm: "기숙사 입소" }}
        />
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col gap-5 md:flex-row">
        <div
          ref={panelWrapperRef}
          className="h-[320px] w-full shrink-0 md:h-auto md:min-w-0 md:flex-[910]"
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
