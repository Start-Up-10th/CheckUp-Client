import type { RecentEntry } from "@/lib/admin/face-results";

const RESULT: Record<RecentEntry["kind"], { text: string; color: string }> = {
  success: { text: "성공", color: "text-admin-attendance-text" },
  alreadyDone: { text: "이미 처리", color: "text-admin-text-muted" },
  failure: { text: "실패", color: "text-admin-danger-text" },
};

/**
 * REQ-FACE-007: 최근 인식 목록. 최근 것이 위에 오고, 넘치면 안에서 스크롤한다(최대 30개, DEC-107).
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
            className="flex h-[54px] shrink-0 items-center justify-between rounded-xl bg-admin-row-surface px-4 text-sm"
          >
            <span className="min-w-0 truncate text-admin-text">
              {label ?? "인식 실패"}
            </span>
            <span className={`shrink-0 pl-2 ${RESULT[kind].color}`}>
              {time} · {RESULT[kind].text}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
