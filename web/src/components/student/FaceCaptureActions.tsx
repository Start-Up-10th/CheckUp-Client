const BUTTON_BASE =
  "flex h-[52px] flex-1 items-center justify-center rounded-[15px] text-[15px] font-bold leading-normal disabled:opacity-40 transition enabled:hover:brightness-95 md:h-[60px] md:rounded-[18px] md:text-[17px]";

/**
 * 얼굴 촬영 완료 단계의 버튼 두 개(Figma 692:44). 높이 52px·간격 10px·좌우 18px.
 * `다시 찍기`는 촬영본을 버리고 카운트다운부터, `완료`는 등록 요청 후 학생 홈으로 간다(REQ-FACE-001).
 * 높이가 공용 PrimaryButton(54px)과 달라 여기서 따로 그린다.
 * 등록을 보내는 동안에는 둘 다 막고, 보낼 촬영본이 없으면(등록 실패 뒤 폐기) `완료`만 막는다.
 * 막힌 버튼 모양은 Figma에 없어 흐리게(40%)만 한다. 노트북 폭(md 이상)은 높이 60px·17px 문구, 가운데 최대 480px로 키우고 `다시 찍기`는 회색 바탕과 구분되게 흰색으로 한다(DEC-061).
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
    <div className="mx-auto flex gap-2.5 px-[18px] md:max-w-[480px] md:gap-3 md:px-0">
      <button
        type="button"
        onClick={onRetake}
        disabled={retakeDisabled}
        className={`${BUTTON_BASE} bg-admin-ghost-bg text-admin-ghost-text md:bg-admin-surface`}
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
