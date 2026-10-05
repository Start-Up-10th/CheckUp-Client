"use client";

import { useEffect, useId, useState } from "react";
import { CountStepper } from "@/components/admin/student-management/CountStepper";
import { roomLabel } from "@/lib/admin/volunteer-roster";
import type { RosterStudent } from "@/lib/admin/volunteer-types";

type StudentDetailDialogProps = {
  student: RosterStudent;
  onClose: () => void;
  onSave: (change: { count: number; reason: string }) => void;
};

/**
 * Figma 08 학생 관리의 학생 상세 다이얼로그(`학생 상세 다이얼로그`). 학생 이름·`학번 · 호실`, 봉사 횟수 스테퍼, 사유
 * 입력, 닫기/저장이다. 횟수는 저장해야만 반영되고 닫기는 바꾸지 않는다. 너비는 핸드폰 310·패드 400·컴퓨터 460이다.
 */
export function StudentDetailDialog({
  student,
  onClose,
  onSave,
}: StudentDetailDialogProps) {
  const [count, setCount] = useState(student.count);
  const [reason, setReason] = useState("");
  const titleId = useId();
  const reasonId = useId();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#1c1c1e]/45"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex w-[310px] max-w-[calc(100vw-32px)] flex-col gap-1 rounded-2xl bg-admin-surface p-[18px] md:w-[400px] md:p-5 xl:w-[460px] xl:p-[22px]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id={titleId}
          className="text-lg font-bold leading-[22px] text-admin-text md:text-[19px] md:leading-[23px] xl:text-xl xl:leading-6"
        >
          {student.name}
        </h2>
        <p className="text-[13px] leading-4 text-admin-textMuted xl:text-sm xl:leading-[17px]">
          {student.studentId} · {roomLabel(student.roomNumber)}
        </p>

        <div className="flex w-full items-center justify-between rounded-card border border-admin-attendance-border bg-admin-attendance-bg py-3 pl-4 pr-3">
          <p className="text-[13px] font-medium leading-4 text-admin-attendance-text xl:text-sm xl:leading-[17px]">
            봉사 횟수
          </p>
          <CountStepper
            count={count}
            onDecrease={() => setCount((value) => Math.max(0, value - 1))}
            onIncrease={() => setCount((value) => value + 1)}
          />
        </div>

        <div className="flex w-full flex-col gap-1.5 pt-3.5">
          <label
            htmlFor={reasonId}
            className="text-xs font-medium leading-[14px] text-admin-textMuted xl:text-[13px] xl:leading-4"
          >
            사유
          </label>
          <textarea
            id={reasonId}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="사유를 입력해 주세요"
            className="h-[72px] w-full resize-none rounded-xl border border-admin-border bg-admin-rowSurface px-3.5 py-3 text-[13px] leading-4 text-admin-text placeholder:text-admin-textMuted transition-colors focus:border-admin-textMuted focus:bg-admin-surface focus:outline-none motion-reduce:transition-none md:h-[76px] xl:h-20 xl:text-sm xl:leading-[17px]"
          />
        </div>

        <div className="flex w-full items-start justify-end gap-2 pt-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[13px] bg-admin-ghost-bg px-5 py-3 text-[13px] font-bold leading-4 text-admin-ghost-text xl:text-sm xl:leading-[17px]"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={() => onSave({ count, reason: reason.trim() })}
            className="rounded-[13px] bg-admin-accent-bg px-5 py-3 text-[13px] font-bold leading-4 text-admin-accent-text xl:text-sm xl:leading-[17px]"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
