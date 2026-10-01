import type { RosterStudent } from "@/lib/admin/mock-volunteer-roster";

type VolunteerRosterRowProps = {
  student: RosterStudent;
  onAdjustCount?: (studentId: string, delta: 1 | -1) => void;
  onDesignate?: (studentId: string) => void;
};

const STEP_BUTTON =
  "flex size-7 shrink-0 items-center justify-center rounded-lg border border-admin-border bg-admin-surface text-sm font-bold leading-[17px] text-admin-text disabled:border-admin-divider disabled:text-[#d5d5d8] xl:size-[30px] xl:text-[15px] xl:leading-[18px]";

/**
 * REQ-COM-001·002·006: 봉사자 명단 편집(Figma 07)의 학생 한 줄. 오늘 지정된 행은 라임 테두리·배경이다.
 * 컴퓨터(xl)는 이름·학번·최근 활동이 한 줄이고, 패드(md~xl)는 이름·학번 아래 줄에 최근 활동이 있다.
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
      role="group"
      aria-label={student.name}
      className={`flex items-center justify-between gap-3 rounded-xl py-[11px] pl-4 pr-3 xl:rounded-card xl:py-3 xl:pl-5 xl:pr-4 ${
        student.duty === "designated"
          ? "border border-admin-attendance-border bg-admin-attendance-bg"
          : "bg-admin-rowSurface"
      }`}
    >
      <div className="flex min-w-0 flex-col gap-[3px] whitespace-nowrap xl:flex-row xl:items-center xl:gap-3.5">
        <div className="flex items-center gap-2 xl:contents">
          <p className="text-sm font-bold leading-[17px] text-admin-text xl:text-[15px] xl:leading-[18px]">
            {student.name}
          </p>
          <p className="font-mono text-[11px] leading-[15px] text-admin-textMuted xl:text-[13px] xl:leading-[17px]">
            {student.studentId}
          </p>
        </div>
        <p className="hidden text-[13px] leading-4 text-admin-border xl:block">
          ·
        </p>
        <p className="truncate text-[11px] leading-[13px] text-admin-textMuted xl:text-[13px] xl:leading-4">
          최근 활동 {student.lastActivityDate ?? "-"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-4 xl:gap-5">
        <div className="flex items-center gap-2 xl:gap-2.5">
          <button
            type="button"
            aria-label={`${student.name} 봉사 1회 차감`}
            disabled={student.count === 0}
            onClick={() => onAdjustCount?.(student.studentId, -1)}
            className={STEP_BUTTON}
          >
            −
          </button>
          <p className="w-[30px] text-center text-[13px] font-bold leading-4 text-admin-text xl:w-9 xl:text-sm xl:leading-[17px]">
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
          className={`w-[85px] rounded-lg px-3 py-1.5 text-xs font-bold leading-[14px] xl:w-[91px] xl:rounded-[10px] xl:px-3.5 xl:py-[9px] xl:text-[13px] xl:leading-4 ${
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
