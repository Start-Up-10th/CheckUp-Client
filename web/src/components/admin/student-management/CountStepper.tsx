type CountStepperProps = {
  count: number;
  onDecrease: () => void;
  onIncrease: () => void;
};

const STEP_BUTTON =
  "flex size-[30px] items-center justify-center rounded-[11px] border border-admin-border bg-admin-surface transition-colors enabled:hover:bg-admin-bg text-base font-bold leading-[19px] text-admin-ghost-text md:size-8 md:text-[17px] md:leading-5 xl:size-[34px] xl:text-lg xl:leading-[22px]";

/**
 * Figma 08 학생 상세의 봉사 횟수 스테퍼 `− 3회 +`. 버튼은 핸드폰 30·패드 32·컴퓨터 34 정사각이고 횟수는 19/20/22
 * 글자다. 횟수는 0 아래로 내려가지 않는다(REQ-COM-002).
 */
export function CountStepper({
  count,
  onDecrease,
  onIncrease,
}: CountStepperProps) {
  return (
    <div className="flex items-center gap-3.5">
      <button
        type="button"
        aria-label="봉사 횟수 줄이기"
        disabled={count === 0}
        onClick={onDecrease}
        className={STEP_BUTTON}
      >
        −
      </button>
      <p
        aria-live="polite"
        className="text-[19px] font-bold leading-[23px] text-admin-attendance-text md:text-xl md:leading-6 xl:text-[22px] xl:leading-[26px]"
      >
        {count}회
      </p>
      <button
        type="button"
        aria-label="봉사 횟수 늘리기"
        onClick={onIncrease}
        className={STEP_BUTTON}
      >
        +
      </button>
    </div>
  );
}
