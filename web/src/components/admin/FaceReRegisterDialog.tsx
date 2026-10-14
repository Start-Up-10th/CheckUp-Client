"use client";

import { useId } from "react";
import { useModalDialog } from "@/lib/admin/use-modal-dialog";

type FaceReRegisterDialogProps = {
  /** 이미 얼굴이 등록된 계정이면 true(기본). false면 처음 등록하는 계정용 문구를 보인다. */
  registered?: boolean;
  /** `뒤로가기`: 창을 닫고 `얼굴 등록`을 누르기 전 화면에 머문다. */
  onBack: () => void;
  /** `다음`: 개인정보 동의로 가서 등록한다. */
  onNext: () => void;
};

/**
 * 마이페이지 `얼굴 등록`을 눌렀을 때 보이는 확인 창(REQ-FACE-001, DEC-079). 이미 등록한 계정은 `다시 등록하시겠습니까?`,
 * 아직 등록하지 않은 계정은 `얼굴을 등록하시겠습니까?`를 묻고 `뒤로가기`/`다음`을 둔다. `뒤로가기`와 Esc·바깥 누르기는 창만 닫고, `다음`만
 * 개인정보 동의로 보낸다. 모양은 다른 관리자 다이얼로그(폭 310/400/460, 반지름 16, 딤 45%)와 같다.
 */
export function FaceReRegisterDialog({
  registered = true,
  onBack,
  onNext,
}: FaceReRegisterDialogProps) {
  const titleId = useId();

  const panelRef = useModalDialog<HTMLDivElement>(onBack);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#1c1c1e]/45 dark:bg-black/60 animate-dim-in motion-reduce:animate-none"
      role="presentation"
      onClick={onBack}
    >
      <div
        role="dialog"
        aria-modal="true"
        ref={panelRef}
        tabIndex={-1}
        aria-labelledby={titleId}
        className="flex max-h-[calc(100dvh-32px)] w-[310px] max-w-[calc(100vw-32px)] flex-col gap-1 rounded-2xl bg-admin-surface p-[18px] md:w-[400px] md:p-5 xl:w-[460px] xl:p-[22px] outline-none animate-dialog-in motion-reduce:animate-none"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id={titleId}
          className="text-lg font-bold leading-[22px] text-admin-text md:text-[19px] md:leading-[23px] xl:text-xl xl:leading-6"
        >
          {registered ? "이미 얼굴이 등록되어 있어요" : "얼굴을 등록해요"}
        </h2>
        <p className="text-[13px] leading-[18px] text-admin-text xl:text-sm xl:leading-[20px]">
          {registered ? "다시 등록하시겠습니까?" : "얼굴을 등록하시겠습니까?"}
        </p>
        <p className="text-[13px] leading-4 text-admin-textMuted xl:text-sm xl:leading-[17px]">
          {registered
            ? "다시 등록하면 기존에 등록한 얼굴이 새 얼굴로 바뀌어요."
            : "개인정보 동의 뒤 얼굴을 촬영해요."}
        </p>

        <div className="flex w-full items-start justify-end gap-2 pt-3.5">
          <button
            type="button"
            onClick={onBack}
            className="rounded-[13px] bg-admin-ghost-bg px-5 py-3 text-[13px] font-bold leading-4 text-admin-ghost-text transition-colors hover:bg-admin-border xl:text-sm xl:leading-[17px]"
          >
            뒤로가기
          </button>
          <button
            type="button"
            onClick={onNext}
            className="rounded-[13px] bg-admin-accent-bg px-5 py-3 text-[13px] font-bold leading-4 text-admin-accent-text transition hover:brightness-95 xl:text-sm xl:leading-[17px]"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
