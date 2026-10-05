import type { RefObject } from "react";
import { StatusBanner } from "@/components/admin/StatusBanner";
import { CloseIcon, ExpandIcon } from "@/components/icons/CameraIcons";
import type { CameraStatus } from "@/lib/admin/use-camera-stream";

type CameraPanelProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  isFullscreen: boolean;
  /** 방금 인식에 성공했을 때의 문구(`성공 · 학번 이름`). 있으면 `인식 대기 중`을 대신한다. */
  successMessage?: string | null;
  /** 방금 인식에 실패했을 때의 문구. 있으면 카메라 하단에 실패 배너로 잠깐 보인다(REQ-FACE-006). */
  failureMessage?: string | null;
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
  successMessage = null,
  failureMessage = null,
  onEnterFullscreen,
  onExitFullscreen,
}: CameraPanelProps) {
  const live = status === "granted";

  return (
    <div
      className={`flex h-full w-full flex-col gap-3 bg-[#1c1c1e] max-md:h-auto max-md:self-stretch md:gap-[14px] xl:gap-[18px] ${isFullscreen ? "" : "rounded-[18px] p-4 md:p-5 xl:rounded-[20px] xl:p-6"}`}
    >
      {!isFullscreen && (
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
              className="absolute left-5 top-5 flex size-10 items-center justify-center rounded-full bg-white/[0.14] md:left-6 md:top-6 md:size-10 xl:left-[27px] xl:top-[23px] xl:size-11"
            >
              <CloseIcon className="size-[18px] text-white md:size-5" />
            </button>
            {live && (
              <div className="absolute right-6 top-6 flex items-center gap-1.5 md:left-1/2 md:right-auto md:top-[30px] md:-translate-x-1/2 md:gap-2">
                <span className="size-[7px] rounded-full bg-admin-accent-bg md:size-[9px]" />
                <span className="text-xs leading-[14px] text-admin-accent-bg md:text-sm md:leading-[17px]">
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

        {/* REQ-FACE-006: 카메라 하단에 성공·실패를 잠시 보인다. 전체화면의 성공은 아래 큰 문구가 대신한다. */}
        {status !== "error" &&
          (failureMessage || (successMessage && !isFullscreen)) && (
            <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-col items-center gap-2 md:bottom-4">
              {successMessage && !isFullscreen && (
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
          <div className="pointer-events-none absolute inset-x-0 bottom-[28.8%] flex flex-col items-center gap-1.5 text-center text-white md:bottom-[8.98%] md:gap-2 xl:bottom-[10.19%]">
            <p className="text-[26px] font-bold leading-[31px] tracking-[-0.52px] md:text-[40px] md:font-medium md:leading-[48px] md:tracking-normal xl:text-[52px] xl:leading-[62px]">
              {successMessage ?? "인식 대기 중"}
            </p>
            {!successMessage && (
              <p className="text-[13px] leading-4 opacity-50 md:text-sm md:leading-[17px] xl:text-base xl:leading-[19px]">
                가이드 안에 얼굴을 맞춰 주세요
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
