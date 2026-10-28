import type { RecentEntry } from "@/lib/admin/face-results";

const RESULT: Record<
  RecentEntry["kind"],
  { text: string; dot: string; pill: string }
> = {
  success: {
    text: "성공",
    dot: "bg-admin-attendance-text",
    pill: "border-admin-attendance-border bg-admin-attendance-bg text-admin-attendance-text",
  },
  alreadyDone: {
    text: "이미 처리",
    dot: "bg-admin-textMuted",
    pill: "border-admin-absence-border bg-admin-absence-bg text-admin-absence-text",
  },
  failure: {
    text: "실패",
    dot: "bg-admin-danger-text",
    pill: "border-admin-danger-border bg-admin-danger-bg text-admin-danger-text",
  },
};

/**
 * REQ-FACE-007: 최근 인식 목록. 최근 것이 위에 오고, 넘치면 안에서 스크롤한다(최대 30개, DEC-108).
 * 컴퓨터(xl)는 카메라 오른쪽, 패드·휴대폰은 카메라 아래에 둔다.
 */
export function RecentRecognitions({ entries }: { entries: RecentEntry[] }) {
  return (
    <section
      aria-label="최근 인식"
      className="flex h-[260px] w-full shrink-0 flex-col gap-3 rounded-[18px] bg-admin-surface p-4 md:p-5 xl:h-auto xl:w-[420px] xl:rounded-[20px] xl:p-6"
    >
      <h2 className="text-sm font-bold text-admin-text md:text-base">
        최근 인식
      </h2>
      <ul
        aria-live="polite"
        className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto"
      >
        {entries.map(({ id, kind, label, time }) => (
          <li
            key={id}
            className="flex h-[54px] shrink-0 items-center justify-between gap-2 rounded-xl border border-admin-divider bg-admin-ghost-bg px-4 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                aria-hidden
                className={`size-2 shrink-0 rounded-full ${RESULT[kind].dot}`}
              />
              <span className="min-w-0 truncate font-medium text-admin-text">
                {label ?? "인식 실패"}
              </span>
            </span>
            <span
              className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${RESULT[kind].pill}`}
            >
              {time} · {RESULT[kind].text}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
