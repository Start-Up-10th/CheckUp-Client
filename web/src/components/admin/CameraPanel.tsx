import type { RefObject } from "react";
import { StatusBanner } from "@/components/admin/StatusBanner";
import type { CameraStatus } from "@/lib/admin/use-camera-stream";

type CameraPanelProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  /** 방금 인식에 성공했을 때의 문구(`성공 · 학번 이름`). */
  successMessage?: string | null;
  /** 방금 인식에 실패했을 때의 문구. 있으면 카메라 하단에 실패 배너로 잠깐 보인다(REQ-FACE-006). */
  failureMessage?: string | null;
  /** 인식 서버 연결 실패. 카메라 하단에 오류 배너와 다시 시도를 보인다. */
  recognitionFailed?: boolean;
  onRetry?: () => void;
};

/**
 * REQ-FACE-004/007: 카메라는 자동 실행되고 시작 버튼은 없다. LIVE는 허용된 뒤에만 표시한다.
 * 전체화면 모드·전체화면 버튼은 없다(Figma 2026-10-06 사용자 수정, DEC-036).
 */
export function CameraPanel({
  videoRef,
  status,
  successMessage = null,
  failureMessage = null,
  recognitionFailed = false,
  onRetry,
}: CameraPanelProps) {
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

        {/* REQ-FACE-006: 카메라 하단에 성공·실패를 잠시 보인다. */}
        {status !== "error" && (failureMessage || successMessage) && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-col items-center gap-2 md:bottom-4">
            {successMessage && (
              <>
                <StatusBanner
                  variant="success"
                  message={successMessage}
                  compactOnPhone
                  className="xl:hidden"
                />
                {/* 컴퓨터(Figma 16:26 `성공 칩`): 흰 칩 + 초록 체크 원 + 굵은 초록 글자. 같은 문구라 화면 읽기에는 배너만 쓴다. */}
                <div
                  aria-hidden="true"
                  className="hidden items-center gap-[9px] rounded-xl border border-admin-border bg-admin-surface px-[13px] py-[11px] xl:flex"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-admin-attendance-text text-[11px] font-bold leading-none text-white">
                    ✓
                  </span>
                  <span className="text-[13px] font-bold leading-4 text-admin-attendance-text">
                    {successMessage}
                  </span>
                </div>
              </>
            )}
            {failureMessage && (
              <StatusBanner
                variant="error"
                message={failureMessage}
                compactOnPhone
              />
            )}
          </div>
        )}

        {status === "error" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-[10%] flex flex-col items-center gap-2 text-center text-white">
            <p className="text-sm font-medium">
              카메라를 자동으로 실행하지 못했습니다.
            </p>
          </div>
        )}

        {/* 인식 서버 연결 실패: Figma에 없는 상태라 다른 성공·실패 표시처럼 카메라 하단의 작은 배너로 보인다. */}
        {recognitionFailed && status !== "error" && onRetry && (
          <div className="absolute inset-x-3 bottom-3 flex justify-center md:bottom-4">
            <div
              role="alert"
              className="flex w-full items-center gap-2 rounded-[10px] border border-admin-danger-border bg-admin-danger-bg px-3 py-2.5 md:w-auto md:gap-[9px] md:rounded-xl md:px-3.5 md:py-3"
            >
              <span className="size-1.5 shrink-0 rounded-full bg-admin-danger-text md:size-[7px]" />
              <p className="min-w-0 flex-1 break-keep text-xs leading-4 text-admin-danger-text md:flex-none md:text-[13px]">
                <span className="font-bold">불러오지 못했어요</span>
              </p>
              <button
                type="button"
                onClick={onRetry}
                className="shrink-0 rounded-lg bg-admin-text px-2.5 py-1.5 text-[11px] leading-4 text-white md:ml-1 md:px-3 md:text-xs"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
