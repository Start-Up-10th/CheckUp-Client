import type { RosterStudent } from "@/lib/admin/mock-volunteer-roster";

type VolunteerRosterRowProps = {
  student: RosterStudent;
  onAdjustCount?: (studentId: string, delta: 1 | -1) => void;
  onDesignate?: (studentId: string) => void;
};

const STEP_BUTTON =
  "flex size-[30px] shrink-0 items-center justify-center rounded-lg border border-admin-border bg-admin-surface text-[15px] font-bold leading-[18px] text-admin-text disabled:border-admin-divider disabled:text-[#d5d5d8]";

/**
 * REQ-COM-001·002·006: 봉사자 명단 편집(Figma 07)의 학생 한 줄. 오늘 지정된 행은 라임 테두리·배경이다.
 * 버튼 라벨은 지정 전 `봉사자 지정`, 지정 후 `지정됨`이다. 완료한 지정은 Figma에 디자인이 없어 `지정됨`과 같은
 * 스타일에 `완료됨`으로 표시한다.
 */
export function VolunteerRosterRow({
  student,
  onAdjustCount,
  onDesignate,
}: VolunteerRosterRowProps) {
  const designated = student.duty !== "none";

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-card py-3 pl-5 pr-4 ${
        student.duty === "designated"
          ? "border border-admin-attendance-border bg-admin-attendance-bg"
          : "bg-admin-rowSurface"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3.5 whitespace-nowrap">
        <p className="text-[15px] font-bold leading-[18px] text-admin-text">
          {student.name}
        </p>
        <p className="font-mono text-[13px] leading-[17px] text-admin-textMuted">
          {student.studentId}
        </p>
        <p className="text-[13px] leading-4 text-admin-border">·</p>
        <p className="truncate text-[13px] leading-4 text-admin-textMuted">
          최근 활동 {student.lastActivityDate ?? "-"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-5">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            aria-label={`${student.name} 봉사 1회 차감`}
            disabled={student.count === 0}
            onClick={() => onAdjustCount?.(student.studentId, -1)}
            className={STEP_BUTTON}
          >
            −
          </button>
          <p className="w-9 text-center text-sm font-bold leading-[17px] text-admin-text">
            {student.count}회
          </p>
          <button
            type="button"
            aria-label={`${student.name} 봉사 1회 추가`}
            onClick={() => onAdjustCount?.(student.studentId, 1)}
            className={STEP_BUTTON}
          >
            +
          </button>
        </div>
        <button
          type="button"
          aria-label={
            designated
              ? `${student.name} ${student.duty === "completed" ? "봉사 완료" : "당일 봉사자로 지정됨"}`
              : `${student.name} 당일 봉사자로 지정`
          }
          onClick={() => onDesignate?.(student.studentId)}
          className={`w-[91px] rounded-[10px] px-3.5 py-[9px] text-[13px] font-bold leading-4 ${
            designated
              ? "border border-admin-attendance-border bg-admin-surface text-admin-attendance-text"
              : "bg-admin-accent-bg text-admin-accent-text"
          }`}
        >
          {student.duty === "none"
            ? "봉사자 지정"
            : student.duty === "designated"
              ? "지정됨"
              : "완료됨"}
        </button>
      </div>
    </div>
  );
}
