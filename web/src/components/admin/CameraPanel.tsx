import type { RefObject } from "react";
import { CloseIcon, ExpandIcon } from "@/components/icons/CameraIcons";
import type { CameraStatus } from "@/lib/admin/use-camera-stream";

type CameraPanelProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  isFullscreen: boolean;
  onEnterFullscreen: () => void;
  onExitFullscreen: () => void;
};

/**
 * REQ-FACE-004/007: 카메라는 자동 실행되고 시작 버튼은 없다. LIVE는 허용된 뒤에만 표시한다.
 * 전체화면은 표시 모드일 뿐이며(같은 video 엘리먼트를 그대로 유지) 새 인식 세션을 만들지 않는다.
 */
export function CameraPanel({
  videoRef,
  status,
  isFullscreen,
  onEnterFullscreen,
  onExitFullscreen,
}: CameraPanelProps) {
  const live = status === "granted";

  return (
    <div
      className={`flex h-full w-full flex-col gap-[18px] bg-[#1c1c1e] ${isFullscreen ? "" : "rounded-[20px] p-6"}`}
    >
      {!isFullscreen && (
        <div className="flex w-full items-center justify-between">
          <p className="text-sm text-white/70">카메라 화면</p>
          {live && (
            <div className="flex items-center gap-2">
              <span className="size-[7px] rounded-full bg-admin-accent-bg" />
              <span className="text-xs text-admin-accent-bg">LIVE</span>
            </div>
          )}
        </div>
      )}

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[16px] bg-[#2c2c2f]">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="size-full object-cover"
        />

        {isFullscreen ? (
          <>
            <button
              type="button"
              onClick={onExitFullscreen}
              aria-label="전체화면 닫기"
              className="absolute left-[27px] top-[23px] flex size-11 items-center justify-center rounded-full bg-white/[0.14]"
            >
              <CloseIcon className="size-5 text-white" />
            </button>
            {live && (
              <div className="absolute left-1/2 top-[30px] flex -translate-x-1/2 items-center gap-2">
                <span className="size-[9px] rounded-full bg-admin-accent-bg" />
                <span className="text-sm text-admin-accent-bg">LIVE</span>
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={onEnterFullscreen}
            aria-label="전체화면으로 보기"
            className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-[13px] bg-white/[0.14]"
          >
            <ExpandIcon className="size-5 text-white" />
          </button>
        )}

        {status === "error" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-[10%] flex flex-col items-center gap-2 text-center text-white">
            <p
              className={
                isFullscreen ? "text-lg font-medium" : "text-sm font-medium"
              }
            >
              카메라를 자동으로 실행하지 못했습니다.
            </p>
          </div>
        )}

        {/* REQ-FACE-007: 대기 문구는 Figma 전체화면(115:5)에만 있고 일반 화면 목업은 비어 있다 — 디자인대로 전체화면에만 표시한다. */}
        {status !== "error" && isFullscreen && (
          <div className="pointer-events-none absolute inset-x-0 bottom-[10%] flex flex-col items-center gap-2 text-center text-white">
            <p className="text-[52px] font-medium">인식 대기 중</p>
            <p className="text-base opacity-50">
              가이드 안에 얼굴을 맞춰 주세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
