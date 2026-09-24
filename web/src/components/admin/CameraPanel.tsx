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
      className={`flex h-full w-full flex-col gap-3 bg-[#1c1c1e] max-md:h-auto max-md:self-stretch md:gap-[18px] ${isFullscreen ? "" : "rounded-[18px] p-4 md:rounded-[20px] md:p-6"}`}
    >
      {!isFullscreen && (
        <div className="flex w-full items-center justify-between">
          <p className="text-xs leading-[14px] text-white/70 md:text-sm">
            카메라 화면
          </p>
          {live && (
            <div className="flex items-center gap-1.5 md:gap-2">
              <span className="size-1.5 rounded-full bg-admin-accent-bg md:size-[7px]" />
              <span className="text-[10px] leading-3 text-admin-accent-bg md:text-xs">
                LIVE
              </span>
            </div>
          )}
        </div>
      )}

      <div
        className={`relative min-h-0 flex-1 overflow-hidden rounded-[14px] bg-[#2c2c2f] md:rounded-[16px] ${isFullscreen ? "max-md:rounded-none max-md:bg-[#1c1c1e]" : ""}`}
      >
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
              className="absolute left-5 top-5 flex size-10 items-center justify-center rounded-full bg-white/[0.14] md:left-[27px] md:top-[23px] md:size-11"
            >
              <CloseIcon className="size-[18px] text-white md:size-5" />
            </button>
            {live && (
              <div className="absolute right-6 top-6 flex items-center gap-1.5 md:left-1/2 md:right-auto md:top-[30px] md:-translate-x-1/2 md:gap-2">
                <span className="size-[7px] rounded-full bg-admin-accent-bg md:size-[9px]" />
                <span className="text-xs leading-[14px] text-admin-accent-bg md:text-sm">
                  LIVE
                </span>
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={onEnterFullscreen}
            aria-label="전체화면으로 보기"
            className="absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-[13px] bg-white/[0.14] md:right-4 md:top-4 md:size-11"
          >
            <ExpandIcon className="size-[15px] text-white md:size-5" />
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
          <div className="pointer-events-none absolute inset-x-0 bottom-[28.8%] flex flex-col items-center gap-1.5 text-center text-white md:bottom-[10%] md:gap-2">
            <p className="text-[26px] font-bold leading-[31px] tracking-[-0.52px] md:text-[52px] md:font-medium md:leading-normal md:tracking-normal">
              인식 대기 중
            </p>
            <p className="text-[13px] leading-4 opacity-50 md:text-base">
              가이드 안에 얼굴을 맞춰 주세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
