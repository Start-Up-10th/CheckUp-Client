const BUTTON_BASE =
  "flex h-[52px] flex-1 items-center justify-center rounded-[15px] text-[15px] font-bold leading-normal";

/**
 * 얼굴 촬영 완료 단계의 버튼 두 개(Figma 692:44). 높이 52px·간격 10px·좌우 18px.
 * `다시 찍기`는 촬영본을 버리고 카운트다운부터, `완료`는 등록 요청 후 학생 홈으로 간다(REQ-FACE-001).
 * 높이가 공용 PrimaryButton(54px)과 달라 여기서 따로 그린다.
 */
export function FaceCaptureActions({
  onRetake,
  onComplete,
}: {
  onRetake: () => void;
  onComplete: () => void;
}) {
  return (
    <div className="flex gap-2.5 px-[18px]">
      <button
        type="button"
        onClick={onRetake}
        className={`${BUTTON_BASE} bg-admin-ghost-bg text-admin-ghost-text`}
      >
        다시 찍기
      </button>
      <button
        type="button"
        onClick={onComplete}
        className={`${BUTTON_BASE} bg-admin-accent-bg text-admin-accent-text`}
      >
        완료
      </button>
    </div>
  );
}
