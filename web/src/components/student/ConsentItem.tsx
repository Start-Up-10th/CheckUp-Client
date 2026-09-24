import { ConsentCheckbox } from "./ConsentCheckbox";

type ConsentItemProps = {
  title: string;
  description: string;
  required: boolean;
  checked: boolean;
  onToggle: () => void;
};

/**
 * REQ-AUTH-004 동의 항목 카드(Figma 622:8). 카드 전체가 하나의 체크박스라
 * 어디를 눌러도 켜고 끌 수 있다. 필수/선택 배지는 Figma 622:14(필수)·622:32(선택).
 */
export function ConsentItem({
  title,
  description,
  required,
  checked,
  onToggle,
}: ConsentItemProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className="flex w-full items-start gap-3 rounded-control bg-admin-rowSurface px-3.5 py-[13px] text-left"
    >
      <ConsentCheckbox checked={checked} />
      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="flex items-center gap-1.5">
          <span className="text-[13px] font-bold leading-normal text-admin-text md:text-[15px]">
            {title}
          </span>
          <span
            className={`rounded-full px-[7px] py-0.5 text-[10px] font-bold leading-normal md:text-xs ${
              required
                ? "bg-admin-attendance-bg text-admin-attendance-text"
                : "bg-admin-absence-bg text-admin-absence-text"
            }`}
          >
            {required ? "필수" : "선택"}
          </span>
        </span>
        <span className="text-[11px] leading-normal text-admin-textMuted md:text-[13px]">
          {description}
        </span>
      </span>
    </button>
  );
}
