"use client";

import { useId, useState } from "react";
import type { Floor } from "@/lib/admin/floor-types";
import { useModalDialog } from "@/lib/admin/use-modal-dialog";

const FLOORS: Floor[] = [3, 4, 5];

type FaceFloorDialogProps = {
  /** `확인`: 고른 층으로 얼굴 인식 화면에 들어간다. */
  onSelect: (floor: Floor) => void;
  /** `취소`와 Esc·바깥 누르기: 얼굴 인식에 들어가지 않고 홈으로 돌아간다. */
  onCancel: () => void;
};

/**
 * 얼굴 인식 생성에 들어가기 전에 층(3·4·5층)을 고르는 창(DEC-100). 층 버튼은 처음에 회색이고 누른 층만 연두색으로 선택되며,
 * `확인`을 눌러야 들어간다(층을 고르기 전에는 `확인`이 꺼져 있다). 층을 고르기 전에는 카메라를 켜지 않는다.
 * 모양은 다른 관리자 다이얼로그(폭 310/400/460, 반지름 16, 딤 45%)와 같다.
 */
export function FaceFloorDialog({ onSelect, onCancel }: FaceFloorDialogProps) {
  const titleId = useId();
  const [picked, setPicked] = useState<Floor | null>(null);
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
        className="flex max-h-[calc(100dvh-32px)] w-[310px] max-w-[calc(100vw-32px)] flex-col gap-1 rounded-2xl bg-admin-surface p-[18px] md:w-[400px] md:p-5 xl:w-[460px] xl:p-[22px] outline-none animate-dialog-in motion-reduce:animate-none"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id={titleId}
          className="text-lg font-bold leading-[22px] text-admin-text md:text-[19px] md:leading-[23px] xl:text-xl xl:leading-6"
        >
          층을 선택해 주세요
        </h2>
        <p className="text-[13px] leading-4 text-admin-textMuted xl:text-sm xl:leading-[17px]">
          얼굴 인식을 사용할 층을 골라요.
        </p>

        <div className="flex w-full items-start gap-2 pt-3.5">
          {FLOORS.map((floor) => {
            const active = floor === picked;
            return (
              <button
                key={floor}
                type="button"
                aria-pressed={active}
                onClick={() => setPicked(floor)}
                className={`flex-1 rounded-[13px] py-3 text-sm font-bold leading-[17px] transition xl:text-base xl:leading-5 ${
                  active
                    ? "bg-admin-attendance-bg text-admin-attendance-text"
                    : "bg-admin-ghost-bg text-admin-ghost-text hover:bg-admin-border"
                }`}
              >
                {floor}층
              </button>
            );
          })}
        </div>
        <div className="flex w-full items-start justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[13px] bg-admin-ghost-bg px-5 py-3 text-[13px] font-bold leading-4 text-admin-ghost-text transition-colors hover:bg-admin-border xl:text-sm xl:leading-[17px]"
          >
            취소
          </button>
          <button
            type="button"
            disabled={picked === null}
            onClick={() => picked !== null && onSelect(picked)}
            className="rounded-[13px] bg-admin-accent-bg px-5 py-3 text-[13px] font-bold leading-4 text-admin-accent-text transition hover:brightness-95 disabled:opacity-40 disabled:hover:brightness-100 xl:text-sm xl:leading-[17px]"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
