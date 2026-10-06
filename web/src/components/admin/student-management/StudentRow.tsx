import type { RosterStudent } from "@/lib/admin/volunteer-types";

type StudentRowProps = {
  student: RosterStudent;
  onSelect: (studentId: string) => void;
};

/**
 * Figma 08 학생 관리의 학생 한 줄. 누르면 학생 상세 다이얼로그가 열린다. 폭별 구성이 다르다.
 * - 컴퓨터(xl): 이름·학번·`·`·최근 활동이 한 줄, 오른쪽에 남은 횟수와 ›.
 * - 패드(md~xl): 왼쪽에 이름·학번 위, 최근 활동 아래, 오른쪽에 남은 횟수와 ›.
 * - 핸드폰: 두 줄. 위에 이름·학번과 오른쪽 끝 최근 활동, 아래에 남은 횟수와 오른쪽 끝 ›.
 */
export function StudentRow({ student, onSelect }: StudentRowProps) {
  return (
    <button
      type="button"
      aria-label={`${student.name} 학생 상세`}
      onClick={() => onSelect(student.studentId)}
      className="flex w-full flex-col gap-2.5 rounded-xl bg-admin-rowSurface py-[11px] pl-3.5 pr-3 text-left md:flex-row md:items-center md:justify-between md:gap-0 md:pl-4 xl:rounded-card xl:py-3 xl:pl-5 xl:pr-4"
    >
      <span className="flex w-full items-center justify-between whitespace-nowrap md:w-auto md:flex-col md:items-start md:justify-start md:gap-[3px] xl:flex-row xl:items-center xl:gap-3.5">
        <span className="flex items-center gap-2 xl:contents">
          <span className="text-[13px] font-bold leading-4 text-admin-text md:text-sm md:leading-[17px] xl:text-[15px] xl:leading-[18px]">
            {student.name}
          </span>
          <span className="font-mono text-[10px] leading-3 text-admin-textMuted md:text-[11px] md:leading-[13px] xl:text-[13px] xl:leading-4">
            {student.studentId}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="hidden text-[13px] leading-4 text-admin-border xl:block"
        >
          ·
        </span>
        <span className="text-[10px] leading-3 text-admin-textMuted md:text-[11px] md:leading-[13px] xl:text-[13px] xl:leading-4">
          최근 활동 {student.lastActivityDate ?? "-"}
        </span>
      </span>

      <span className="flex w-full items-center justify-between whitespace-nowrap md:w-auto md:gap-4 xl:gap-5">
        <span className="text-[13px] font-bold leading-4 text-admin-text xl:text-sm xl:leading-[17px]">
          {student.count}회
        </span>
        <span aria-hidden="true" className="text-xl leading-6 text-[#c7c7ca]">
          ›
        </span>
      </span>
    </button>
  );
}
