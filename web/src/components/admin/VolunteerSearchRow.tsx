import type { Volunteer } from "@/lib/admin/mock-volunteers";

type VolunteerSearchRowProps = {
  volunteer: Volunteer;
  onAdd: (studentId: string) => void;
  onRequestRemove: (volunteer: Volunteer) => void;
};

/** REQ-COM-001: 미등록은 추가(라임), 등록됨은 제외(빨강) 버튼을 보여준다. */
export function VolunteerSearchRow({
  volunteer,
  onAdd,
  onRequestRemove,
}: VolunteerSearchRowProps) {
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
      {volunteer.isMember ? (
        <button
          type="button"
          onClick={() => onRequestRemove(volunteer)}
          className="flex h-[23px] w-[51px] items-center justify-center rounded-lg bg-admin-danger-bg text-[11px] font-bold leading-[13px] text-admin-danger-text md:h-[26px] md:w-[58px] md:rounded-[9px] md:text-[12px] md:leading-normal"
        >
          제외
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onAdd(volunteer.studentId)}
          className="flex h-[23px] w-[51px] items-center justify-center rounded-lg bg-admin-accent-bg text-[11px] font-bold leading-[13px] text-admin-accent-text md:h-[26px] md:w-[58px] md:rounded-[9px] md:text-[12px] md:leading-normal"
        >
          추가
        </button>
      )}
    </div>
  );
}
