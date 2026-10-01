import type { RosterStudent } from "@/lib/admin/mock-volunteer-roster";

type VolunteerDutyRowProps = {
  student: RosterStudent;
  onComplete: (studentId: string) => void;
  onCancel: (studentId: string) => void;
};

/**
 * REQ-COM-006: 봉사자 관리(Figma 06)의 당일 봉사자 한 줄. `완료`는 봉사를 마친 것으로 처리하고,
 * `봉사 제외`는 오늘 지정을 취소한다.
 */
export function VolunteerDutyRow({
  student,
  onComplete,
  onCancel,
}: VolunteerDutyRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-card bg-admin-rowSurface px-5 py-3.5">
      <div className="flex min-w-0 flex-col gap-0.5 whitespace-nowrap">
        <p className="text-[15px] font-bold leading-[18px] text-admin-text">
          {student.name}
        </p>
        <p className="font-mono text-xs leading-4 text-admin-textMuted">
          {student.studentId} · {student.roomNumber}호
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-label={`${student.name} 봉사 완료`}
          onClick={() => onComplete(student.studentId)}
          className="rounded-[10px] bg-admin-accent-bg px-[18px] py-[9px] text-[13px] font-bold leading-4 text-admin-accent-text"
        >
          완료
        </button>
        <button
          type="button"
          aria-label={`${student.name} 당일 봉사자에서 제외`}
          onClick={() => onCancel(student.studentId)}
          className="rounded-[10px] bg-admin-danger-bg px-[18px] py-[9px] text-[13px] font-bold leading-4 text-admin-danger-text"
        >
          봉사 제외
        </button>
      </div>
    </div>
  );
}
