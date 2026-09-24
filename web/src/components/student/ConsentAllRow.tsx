import { ConsentCheckbox } from "./ConsentCheckbox";

type ConsentAllRowProps = {
  checked: boolean;
  onToggle: () => void;
};

/**
 * REQ-AUTH-004 "전체 동의" 줄(Figma 622:36). 켜면 세 항목을 모두 선택하고,
 * 항목 중 하나라도 꺼지면 함께 꺼진다 — 그 계산은 화면(부모)이 한다.
 */
export function ConsentAllRow({ checked, onToggle }: ConsentAllRowProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className="flex w-full items-center gap-3 px-3.5 pb-3.5 pt-4 text-left md:pb-4 md:pt-[18px]"
    >
      <ConsentCheckbox checked={checked} />
      <span className="text-[15px] font-bold leading-normal text-admin-text md:text-base">
        전체 동의
      </span>
    </button>
  );
}
