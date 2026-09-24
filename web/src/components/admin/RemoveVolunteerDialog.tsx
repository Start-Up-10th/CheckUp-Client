import type { Volunteer } from "@/lib/admin/mock-volunteers";

type RemoveVolunteerDialogProps = {
  volunteer: Volunteer;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * REQ-COM-001: 명단 제외는 즉시 반영이 아니라 확인을 거친다. 누적 횟수는 유지됨을 명시한다.
 * Figma node 522:117. RoomDetailDialog와 동일한 다이얼로그 크기/라운드 패턴을 따른다.
 */
export function RemoveVolunteerDialog({
  volunteer,
  onCancel,
  onConfirm,
}: RemoveVolunteerDialogProps) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#1c1c1e]/45"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-volunteer-dialog-title"
        className="z-50 flex w-[310px] max-w-[calc(100vw-32px)] flex-col gap-1.5 rounded-[16px] bg-admin-surface p-4 md:w-[400px] xl:w-[460px]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="remove-volunteer-dialog-title"
          className="text-base font-bold leading-[19px] text-admin-text md:text-[18px] md:leading-normal"
        >
          봉사자 명단에서 제외할까요?
        </h2>
        <p className="text-[13px] leading-4 text-admin-ghost-text md:text-sm md:leading-5">
          {volunteer.name} · {volunteer.studentId} · {volunteer.room}
        </p>
        <p className="text-[13px] leading-4 text-admin-textMuted md:text-sm md:leading-5">
          적립된 봉사 횟수는 그대로 유지됩니다.
        </p>

        <div className="flex h-[100px] w-full items-start justify-end gap-2 pt-3.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[13px] bg-admin-ghost-bg px-[18px] py-[11px] text-[13px] font-bold leading-4 text-admin-ghost-text md:px-[22px] md:py-[13px] md:text-sm md:leading-5"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-[13px] bg-admin-danger-bg px-[18px] py-[11px] text-[13px] font-bold leading-4 text-admin-danger-text md:px-[22px] md:py-[13px] md:text-sm md:leading-5"
          >
            제외
          </button>
        </div>
      </div>
    </div>
  );
}
