"use client";

import { useId } from "react";
import { roomLabel } from "@/lib/admin/volunteer-roster";
import type { DutyRecord } from "@/lib/admin/volunteer-types";
import { useModalDialog } from "@/lib/admin/use-modal-dialog";

type MissedAdjustmentDialogProps = {
  record: DutyRecord;
  onClose: () => void;
};

/**
 * 이미 횟수를 추가해 처리한 미이행(`횟수 처리됨`)의 읽기 전용 상세(#334). 추가된 횟수와 사유만 보이고 −/+ 조작은
 * 없다. 횟수를 더 고치려면 학생 관리에서 한다. 너비는 핸드폰 310·패드 400·컴퓨터 460이다.
 */
export function MissedAdjustmentDialog({
  record,
  onClose,
}: MissedAdjustmentDialogProps) {
  const titleId = useId();
  const panelRef = useModalDialog<HTMLDivElement>(onClose);
  const added = record.addedCount;
  const reason = record.reason?.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1c1e]/45 dark:bg-black/60 animate-dim-in motion-reduce:animate-none"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        ref={panelRef}
        tabIndex={-1}
        aria-labelledby={titleId}
        className="flex max-h-[calc(100dvh-32px)] w-[310px] max-w-[calc(100vw-32px)] flex-col gap-1 overflow-y-auto rounded-2xl bg-admin-surface p-[18px] md:w-[400px] md:p-5 xl:w-[460px] xl:p-[22px] outline-none animate-dialog-in motion-reduce:animate-none"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id={titleId}
          className="text-lg font-bold leading-[22px] text-admin-text md:text-[19px] md:leading-[23px] xl:text-xl xl:leading-6"
        >
          {record.name}
        </h2>
        <p className="text-[13px] leading-4 text-admin-textMuted xl:text-sm xl:leading-[17px]">
          {record.studentId} · {roomLabel(record.roomNumber)}
        </p>

        <div className="flex w-full items-center justify-between rounded-card border border-admin-attendance-border bg-admin-attendance-bg px-4 py-3.5">
          <p className="text-[13px] font-medium leading-4 text-admin-attendance-text xl:text-sm xl:leading-[17px]">
            추가된 봉사 횟수
          </p>
          <p className="font-mono text-lg font-bold leading-[22px] text-admin-attendance-text">
            {added === undefined ? "-" : `${added > 0 ? "+" : ""}${added}회`}
          </p>
        </div>

        <div className="flex w-full flex-col gap-1.5 pt-3.5">
          <p className="text-xs font-medium leading-[14px] text-admin-textMuted xl:text-[13px] xl:leading-4">
            사유
          </p>
          <p className="min-h-[44px] w-full whitespace-pre-wrap break-words rounded-xl bg-admin-rowSurface px-3.5 py-3 text-[13px] leading-5 text-admin-text xl:text-sm">
            {reason || (
              <span className="text-admin-textMuted">
                입력한 사유가 없습니다.
              </span>
            )}
          </p>
        </div>

        <div className="flex w-full items-start justify-end pt-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[13px] bg-admin-ghost-bg transition-colors hover:bg-admin-border px-5 py-3 text-[13px] font-bold leading-4 text-admin-ghost-text xl:text-sm xl:leading-[17px]"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
