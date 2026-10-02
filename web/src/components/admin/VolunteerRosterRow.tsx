import type { RosterStudent } from "@/lib/admin/mock-volunteer-roster";

type VolunteerRosterRowProps = {
  student: RosterStudent;
  onAdjustCount?: (studentId: string, delta: 1 | -1) => void;
  onDesignate?: (studentId: string) => void;
};

const STEP_BUTTON =
  "flex size-[26px] shrink-0 items-center justify-center rounded-[7px] border border-admin-border bg-admin-surface text-[13px] font-bold leading-4 text-admin-text disabled:border-admin-divider disabled:text-[#d5d5d8] md:size-7 md:rounded-lg md:text-sm md:leading-[17px] xl:size-[30px] xl:text-[15px] xl:leading-[18px]";

/**
 * REQ-COM-001·002·006: 봉사자 명단 편집(Figma 07)의 학생 한 줄. 오늘 지정된 행은 라임 테두리·배경이다.
 * 폭별 구성이 다르다.
 * - 컴퓨터(xl): 이름·학번·최근 활동이 한 줄, 오른쪽에 스테퍼와 지정 버튼.
 * - 패드(md~xl): 왼쪽에 이름·학번 위, 최근 활동 아래, 오른쪽에 스테퍼와 지정 버튼.
 * - 핸드폰: 두 줄. 위에 이름·학번과 오른쪽 끝 최근 활동, 아래에 스테퍼와 오른쪽 끝 지정 버튼.
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
      className={`flex flex-col gap-2.5 rounded-xl py-[11px] pl-3.5 pr-3 md:flex-row md:items-center md:justify-between md:gap-3 md:pl-4 xl:rounded-card xl:py-3 xl:pl-5 xl:pr-4 ${
        student.duty === "designated"
          ? "border border-admin-attendance-border bg-admin-attendance-bg"
          : "bg-admin-rowSurface"
      }`}
    >
      <div className="flex min-w-0 items-center justify-between whitespace-nowrap md:flex-col md:items-start md:justify-start md:gap-[3px] xl:flex-row xl:items-center xl:gap-3.5">
        <div className="flex items-center gap-2 xl:contents">
          <p className="text-[13px] font-bold leading-4 text-admin-text md:text-sm md:leading-[17px] xl:text-[15px] xl:leading-[18px]">
            {student.name}
          </p>
          <p className="font-mono text-[10px] leading-[13px] text-admin-textMuted md:text-[11px] md:leading-[15px] xl:text-[13px] xl:leading-[17px]">
            {student.studentId}
          </p>
        </div>
        <p className="hidden text-[13px] leading-4 text-admin-border xl:block">
          ·
        </p>
        <p className="truncate text-[10px] leading-3 text-admin-textMuted md:text-[11px] md:leading-[13px] xl:text-[13px] xl:leading-4">
          최근 활동 {student.lastActivityDate ?? "-"}
        </p>
      </div>

      <div className="flex shrink-0 items-center justify-between md:justify-start md:gap-4 xl:gap-5">
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
          <p className="w-7 text-center text-xs font-bold leading-[14px] text-admin-text md:w-[30px] md:text-[13px] md:leading-4 xl:w-9 xl:text-sm xl:leading-[17px]">
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
          className={`w-[76px] rounded-[7px] px-2.5 py-[5px] text-[11px] font-bold leading-[13px] md:w-[85px] md:rounded-lg md:px-3 md:py-1.5 md:text-xs md:leading-[14px] xl:w-[91px] xl:rounded-[10px] xl:px-3.5 xl:py-[9px] xl:text-[13px] xl:leading-4 ${
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
