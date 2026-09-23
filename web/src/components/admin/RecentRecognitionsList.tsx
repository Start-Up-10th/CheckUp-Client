import type { RecognitionEntry } from "@/lib/admin/mock-recent-recognitions";

type RecentRecognitionsListProps = {
  entries: RecognitionEntry[];
};

/**
 * REQ-FACE-007: 성공 초록·실패 빨강을 텍스트와 함께 표기한다. 기록 없으면 공통 빈 상태(REQ-UI-006).
 * Figma 예시는 성공/실패 텍스트를 모두 회색으로 그렸지만, REQ 문구가 색상 구분을 명시하므로 따른다.
 */
export function RecentRecognitionsList({
  entries,
}: RecentRecognitionsListProps) {
  return (
    <div className="flex h-full w-full flex-1 flex-col gap-2.5 rounded-panel bg-admin-surface p-[22px] md:w-auto md:min-w-[280px] md:flex-[626]">
      <p className="text-sm text-admin-textSecondary">최근 인식</p>

      {entries.length === 0 ? (
        <p className="text-sm text-admin-textMuted">아직 데이터가 없어요</p>
      ) : (
        <div className="flex flex-col gap-2.5 overflow-y-auto">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex w-full items-center justify-between rounded-xl bg-admin-rowSurface px-3.5 py-3"
            >
              <p className="text-sm leading-[17px] text-admin-text">
                {entry.label}
              </p>
              <p
                className={`font-mono text-xs ${
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
