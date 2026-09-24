import type { RecognitionEntry } from "@/lib/admin/mock-recent-recognitions";

export type RecentRecognitionsStatus = "ready" | "loading" | "error";

type RecentRecognitionsListProps = {
  entries: RecognitionEntry[];
  /** 불러오는 중/실패 상태. 기록이 없는 빈 상태는 entries가 비어 있으면 자동으로 보여 준다. */
  status?: RecentRecognitionsStatus;
  onRetry?: () => void;
};

function StateIcon({ src, className }: { src: string; className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-[72px] items-center justify-center rounded-full ${className}`}
    >
      <span
        className="block size-8 bg-current"
        style={{
          maskImage: `url(${src})`,
          WebkitMaskImage: `url(${src})`,
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskSize: "contain",
          WebkitMaskSize: "contain",
        }}
      />
    </span>
  );
}

function StateMessage({
  icon,
  title,
  description,
  onRetry,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      {icon}
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-[19px] font-bold text-admin-text">{title}</p>
        <p className="text-sm text-admin-textMuted">{description}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-xl bg-admin-text px-6 py-[13px] text-[15px] text-white"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

/**
 * 폰(Figma 관리자-핸드폰)은 최근 2건이 보이는 높이(126px)로 고정하고 그 이상은 목록 안에서 스크롤한다.
 * 빈·오류 상태는 폰에서 패널이 남은 높이를 채운다(카메라 패널은 숨김 — AdminFaceRecognition 참고).
 * REQ-FACE-007: 성공 초록·실패 빨강을 텍스트와 함께 표기한다. 상태 문구는 REQ-UI-006.
 * Figma 예시는 성공/실패 텍스트를 모두 회색으로 그렸지만, REQ 문구가 색상 구분을 명시하므로 따른다.
 */
export function RecentRecognitionsList({
  entries,
  status = "ready",
  onRetry,
}: RecentRecognitionsListProps) {
  const isEmpty = status === "ready" && entries.length === 0;
  const fillsHeight = isEmpty || status === "error";

  return (
    <div
      className={`flex w-full flex-col gap-2 rounded-[16px] bg-admin-surface p-3.5 md:gap-2.5 md:rounded-panel md:p-[22px] xl:h-full xl:w-auto xl:min-w-[280px] xl:flex-[626] ${
        fillsHeight
          ? "flex-1"
          : status === "loading"
            ? "flex-none"
            : "h-[126px] flex-none"
      }`}
    >
      <p className="text-xs leading-[14px] text-admin-textSecondary md:text-sm">
        최근 인식
      </p>

      {status === "loading" ? (
        <div
          role="status"
          aria-label="최근 인식을 불러오는 중"
          className="flex flex-col gap-2 md:gap-2.5"
        >
          <div className="h-[26px] rounded-lg bg-[#e7e7e9] md:h-[46px] md:rounded-xl" />
          <div className="h-[26px] rounded-lg bg-[#e7e7e9] md:h-[46px] md:rounded-xl" />
        </div>
      ) : status === "error" ? (
        <StateMessage
          icon={
            <StateIcon
              src="/icons/state-error.svg"
              className="bg-[#fdeceb] text-admin-danger-text"
            />
          }
          title="불러오지 못했어요"
          description="네트워크 연결을 확인하고 다시 시도해 주세요."
          onRetry={onRetry}
        />
      ) : isEmpty ? (
        <StateMessage
          icon={
            <StateIcon
              src="/icons/state-empty.svg"
              className="bg-[#f2f2f3] text-admin-textMuted"
            />
          }
          title="최근 인식 기록이 없어요"
          description="얼굴 인식이 성공하거나 실패하면 여기에 표시됩니다."
        />
      ) : (
        <div className="flex min-h-0 flex-col gap-2 overflow-y-auto md:gap-2.5">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex w-full items-center justify-between rounded-[10px] bg-admin-rowSurface px-3 py-[9px] md:rounded-xl md:px-3.5 md:py-3"
            >
              <p className="text-[13px] leading-4 text-admin-text md:text-sm md:leading-[17px]">
                {entry.label}
              </p>
              <p
                className={`font-mono text-[11px] leading-[15px] md:text-xs ${
                  entry.outcome === "success"
                    ? "text-admin-attendance-text"
                    : "text-admin-danger-text"
                }`}
              >
                {entry.recognizedAt} ·{" "}
                {entry.outcome === "success" ? "성공" : "실패"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
