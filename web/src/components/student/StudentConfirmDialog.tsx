"use client";

import { useId } from "react";
import { useModalDialog } from "@/lib/admin/use-modal-dialog";

type StudentConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  /** `danger`는 로그아웃처럼 되돌리기 번거로운 동작의 빨간 버튼, `accent`는 기본 연두 버튼이다. */
  tone?: "accent" | "danger";
  /** `취소`·Esc·바깥 누르기: 창만 닫고 아무 것도 하지 않는다. */
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * 학생 화면에서 실행 전에 한 번 묻는 확인 창(#356, DEC-105). Figma에 없는 화면이라 관리자 마이페이지 얼굴 등록 확인 창
 * (`FaceReRegisterDialog`, 폭 310/400/460, 반지름 16, 딤 45%)과 같은 모양으로 `취소`/확인 두 버튼을 둔다.
 */
export function StudentConfirmDialog({
  title,
  description,
  confirmLabel,
  tone = "accent",
  onCancel,
  onConfirm,
}: StudentConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useModalDialog<HTMLDivElement>(onCancel);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1c1e]/45 dark:bg-black/60 animate-dim-in motion-reduce:animate-none"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        ref={panelRef}
        tabIndex={-1}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="flex max-h-[calc(100dvh-32px)] w-[310px] max-w-[calc(100vw-32px)] flex-col gap-1 rounded-2xl bg-admin-surface p-[18px] md:w-[400px] md:p-5 xl:w-[460px] xl:p-[22px] outline-none animate-dialog-in motion-reduce:animate-none"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id={titleId}
          className="text-lg font-bold leading-[22px] text-admin-text md:text-[19px] md:leading-[23px] xl:text-xl xl:leading-6"
        >
          {title}
        </h2>
        <p
          id={descriptionId}
          className="text-[13px] leading-[18px] text-admin-textMuted xl:text-sm xl:leading-[20px]"
        >
          {description}
        </p>

        <div className="flex w-full items-start justify-end gap-2 pt-3.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[13px] bg-admin-ghost-bg px-5 py-3 text-[13px] font-bold leading-4 text-admin-ghost-text transition-colors hover:bg-admin-border xl:text-sm xl:leading-[17px]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-[13px] px-5 py-3 text-[13px] font-bold leading-4 transition xl:text-sm xl:leading-[17px] ${
              tone === "danger"
                ? "bg-admin-danger-bg text-admin-danger-text hover:bg-admin-danger-border"
                : "bg-admin-accent-bg text-admin-accent-text hover:brightness-95"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
