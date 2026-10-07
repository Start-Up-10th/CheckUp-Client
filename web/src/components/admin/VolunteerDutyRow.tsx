import type { RosterStudent } from "@/lib/admin/volunteer-types";
import { lastActivityKorean, roomLabel } from "@/lib/admin/volunteer-roster";

type VolunteerDutyRowProps = {
  student: RosterStudent;
  onComplete: (studentId: string) => void;
  onCancel: (studentId: string) => void;
};

/**
 * REQ-COM-006: 봉사자 관리(Figma 06)의 당일 봉사자 한 줄. `완료`는 봉사를 마친 것으로 처리하고,
 * `봉사 제외`는 오늘 지정을 취소한다. 패드(md~xl)는 가운데에 최근 활동 날짜(`9월 12일`)가 있고,
 * 핸드폰은 버튼 라벨이 `제외`로 짧다(접근성 이름은 같다).
 */
export function VolunteerDutyRow({
  student,
  onComplete,
  onCancel,
}: VolunteerDutyRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[11px] bg-admin-rowSurface px-3.5 py-[11px] md:rounded-xl md:px-4 md:py-3 xl:rounded-card xl:px-5 xl:py-3.5">
      <div className="flex min-w-0 flex-col gap-0.5 whitespace-nowrap">
        <p className="text-[13px] font-bold leading-4 text-admin-text md:text-sm md:leading-[17px] xl:text-[15px] xl:leading-[18px]">
          {student.name}
        </p>
        <p className="font-mono text-[10px] leading-[13px] text-admin-textMuted md:text-[11px] md:leading-[15px] xl:text-xs xl:leading-4">
          {student.studentId} · {roomLabel(student.roomNumber)}
        </p>
      </div>
      <p className="hidden text-xs leading-[14px] text-admin-textSecondary md:block xl:hidden">
        {lastActivityKorean(student.lastActivityDate)}
      </p>
      <div className="flex shrink-0 items-center gap-1.5 xl:gap-2">
        <button
          type="button"
          aria-label={`${student.name} 봉사 완료`}
          onClick={() => onComplete(student.studentId)}
          className="rounded-[10px] bg-admin-accent-bg transition hover:brightness-95 px-3.5 py-2 text-xs font-bold leading-[14px] text-admin-accent-text xl:px-[18px] xl:py-[9px] xl:text-[13px] xl:leading-4"
        >
          완료
        </button>
        <button
          type="button"
          aria-label={`${student.name} 당일 봉사자에서 제외`}
          onClick={() => onCancel(student.studentId)}
          className="rounded-[10px] bg-admin-danger-bg transition-colors hover:bg-admin-danger-border px-3.5 py-2 text-xs font-bold leading-[14px] text-admin-danger-text xl:px-[18px] xl:py-[9px] xl:text-[13px] xl:leading-4"
        >
          <span className="md:hidden">제외</span>
          <span className="hidden md:inline">봉사 제외</span>
        </button>
      </div>
    </div>
  );
}
