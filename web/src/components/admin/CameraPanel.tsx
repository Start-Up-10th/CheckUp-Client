import type { RefObject } from "react";
import type { CameraStatus } from "@/lib/admin/use-camera-stream";

type CameraPanelProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
};

/**
 * REQ-FACE-004/007: 카메라는 자동 실행되고 시작 버튼은 없다. LIVE는 허용된 뒤에만 표시한다.
 * 인식 성공·실패·서버 오류 메시지는 이 패널이 아니라 토스트로 보인다(DEC-048).
 * 전체화면 모드·전체화면 버튼은 없다(Figma 2026-10-06 사용자 수정, DEC-036).
 */
export function CameraPanel({ videoRef, status }: CameraPanelProps) {
  const live = status === "granted";

  return (
    <div className="flex h-full w-full flex-col gap-3 rounded-[18px] bg-[#1c1c1e] p-4 md:gap-[14px] md:p-5 xl:gap-[18px] xl:rounded-[20px] xl:p-6">
      <div className="flex w-full items-center justify-between">
        <p className="text-xs leading-[14px] text-white/70 md:text-sm md:leading-[17px]">
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

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[14px] bg-[#2c2c2f] md:rounded-[16px]">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="size-full object-cover"
        />

        {status === "error" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-[10%] flex flex-col items-center gap-2 text-center text-white">
            <p className="text-sm font-medium">
              카메라를 자동으로 실행하지 못했습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
