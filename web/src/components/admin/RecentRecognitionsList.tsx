import type { RecognitionEntry } from "@/lib/admin/mock-recent-recognitions";

type RecentRecognitionsListProps = {
  entries: RecognitionEntry[];
};

/**
 * 폰(Figma 관리자-핸드폰)은 최근 2건이 보이는 높이(126px)로 고정하고 그 이상은 목록 안에서 스크롤한다.
 * REQ-FACE-007: 성공 초록·실패 빨강을 텍스트와 함께 표기한다. 기록 없으면 공통 빈 상태(REQ-UI-006).
 * Figma 예시는 성공/실패 텍스트를 모두 회색으로 그렸지만, REQ 문구가 색상 구분을 명시하므로 따른다.
 */
export function RecentRecognitionsList({
  entries,
}: RecentRecognitionsListProps) {
  return (
    <div className="flex h-[126px] w-full flex-none flex-col gap-2 rounded-[16px] bg-admin-surface p-3.5 md:h-full md:w-auto md:min-w-[280px] md:flex-[626] md:gap-2.5 md:rounded-panel md:p-[22px]">
      <p className="text-xs leading-[14px] text-admin-textSecondary md:text-sm">
        최근 인식
      </p>

      {entries.length === 0 ? (
        <p className="text-sm text-admin-textMuted">아직 데이터가 없어요</p>
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
