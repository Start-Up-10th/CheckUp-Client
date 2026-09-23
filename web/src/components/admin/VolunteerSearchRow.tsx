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
    <div className="flex w-full items-center justify-between rounded-[14px] bg-admin-rowSurface px-5 py-3.5">
      <div className="flex flex-col gap-0.5">
        <p className="text-[15px] font-bold text-admin-text">
          {volunteer.name}
        </p>
        <p className="font-mono text-xs text-admin-textMuted">
          {volunteer.studentId} · {volunteer.room}
        </p>
      </div>
      {volunteer.isMember ? (
        <button
          type="button"
          onClick={() => onRequestRemove(volunteer)}
          className="flex h-[30px] w-[68px] items-center justify-center rounded-[10px] bg-admin-danger-bg text-[13px] font-bold text-admin-danger-text"
        >
          제외
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onAdd(volunteer.studentId)}
          className="flex h-[30px] w-[68px] items-center justify-center rounded-[10px] bg-admin-accent-bg text-[13px] font-bold text-admin-accent-text"
        >
          추가
        </button>
      )}
    </div>
  );
}
