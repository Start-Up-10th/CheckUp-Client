const BUTTON_BASE =
  "flex h-[52px] flex-1 items-center justify-center rounded-[15px] text-[15px] font-bold leading-normal disabled:opacity-40";

/**
 * 얼굴 촬영 완료 단계의 버튼 두 개(Figma 692:44). 높이 52px·간격 10px·좌우 18px.
 * `다시 찍기`는 촬영본을 버리고 카운트다운부터, `완료`는 등록 요청 후 학생 홈으로 간다(REQ-FACE-001).
 * 높이가 공용 PrimaryButton(54px)과 달라 여기서 따로 그린다.
 * 등록을 보내는 동안에는 둘 다 막고, 보낼 촬영본이 없으면(등록 실패 뒤 폐기) `완료`만 막는다.
 * 막힌 버튼 모양은 Figma에 없어 흐리게(40%)만 한다.
 */
export function FaceCaptureActions({
  onRetake,
  onComplete,
  retakeDisabled = false,
  completeDisabled = false,
}: {
  onRetake: () => void;
  onComplete: () => void;
  retakeDisabled?: boolean;
  completeDisabled?: boolean;
}) {
  return (
    <div className="flex gap-2.5 px-[18px]">
      <button
        type="button"
        onClick={onRetake}
        disabled={retakeDisabled}
        className={`${BUTTON_BASE} bg-admin-ghost-bg text-admin-ghost-text`}
      >
        다시 찍기
      </button>
      <button
        type="button"
        onClick={onComplete}
        disabled={completeDisabled}
        className={`${BUTTON_BASE} bg-admin-accent-bg text-admin-accent-text`}
      >
        완료
      </button>
    </div>
  );
}
