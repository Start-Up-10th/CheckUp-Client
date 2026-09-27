import type { Volunteer } from "@/lib/admin/mock-volunteers";

type VolunteerListRowProps = {
  volunteer: Volunteer;
  onAddCredit: (studentId: string) => void;
  onRemoveCredit: (studentId: string) => void;
};

/**
 * REQ-COM-002: 이름/최근 활동/횟수 표시. "+"는 확인 없이 즉시 1회 적립,
 * "−"는 확인 없이 즉시 1회 차감하며 0회에서는 비활성화된다(2026-09-23 Figma 갱신, DEC-023).
 */
export function VolunteerListRow({
  volunteer,
  onAddCredit,
  onRemoveCredit,
}: VolunteerListRowProps) {
  const hasCredit = volunteer.count > 0;

  return (
    <div className="flex w-full items-center justify-between rounded-[11px] bg-admin-rowSurface px-3.5 py-[11px] md:rounded-[12px] md:px-4 md:py-3">
      <div className="flex flex-col gap-0.5">
        <p className="text-[13px] font-bold leading-4 text-admin-text md:text-[14px] md:leading-normal">
          {volunteer.name}
        </p>
        <p className="font-mono text-[10px] leading-[13px] text-admin-textMuted md:text-[11px]">
          {volunteer.studentId} · {volunteer.room}
        </p>
      </div>
      {/* 패드+: 최근 봉사 날짜 */}
      <p className="hidden text-sm text-admin-textMuted md:block xl:hidden">
        {volunteer.lastActivityDate ?? "−"}
      </p>
      <div className="flex items-center gap-1.5">
        <span
          className={`flex items-center justify-center rounded-lg px-2.5 py-[5px] text-[11px] font-bold leading-[13px] md:rounded-[9px] md:px-3 md:py-[6px] md:text-[12px] md:leading-normal ${
            hasCredit
              ? "bg-admin-attendance-bg text-admin-attendance-text"
              : "border border-admin-border bg-admin-surface text-admin-textMuted"
          }`}
        >
          {volunteer.count}회
        </span>
        <button
          type="button"
          aria-label={`${volunteer.name} 봉사 1회 추가`}
          onClick={() => onAddCredit(volunteer.studentId)}
          className="flex size-6 items-center justify-center rounded-full border border-[#c7c7ca] text-[13px] font-bold leading-4 text-admin-ghost-text md:size-[26px] md:text-[14px] md:leading-normal"
        >
          +
        </button>
        <button
          type="button"
          aria-label={`${volunteer.name} 봉사 1회 차감`}
          disabled={!hasCredit}
          onClick={() => onRemoveCredit(volunteer.studentId)}
          className={`flex size-6 items-center justify-center rounded-full border text-[13px] font-bold leading-4 md:size-[26px] md:text-[14px] md:leading-normal ${
            hasCredit
              ? "border-admin-border text-admin-textMuted"
              : "border-admin-divider text-[#d5d5d8]"
          }`}
        >
          −
        </button>
      </div>
    </div>
  );
}
