import type { ScreenMode } from "@/lib/admin/use-screen-mode";

type ModeToggleProps = {
  mode: ScreenMode;
  onChange: (mode: ScreenMode) => void;
};

/**
 * Figma `ModeToggle`: 라이트는 흰 손잡이에 해, 다크는 라임 손잡이에 달이다. 크기는 핸드폰·패드 48×28
 * (컴포넌트 원본), 컴퓨터 60×35(마이페이지 1297:40)다. 켜진(다크) 상태가 `aria-checked`다.
 * 색은 Figma 컴포넌트 Mode=Light/Dark 값이다.
 */
export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const dark = mode === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="화면 모드"
      onClick={() => onChange(dark ? "light" : "dark")}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors motion-reduce:transition-none xl:h-[35px] xl:w-[60px] ${
        dark
          ? "border border-[#4a473f] bg-[#3d3c38]"
          : "border border-transparent bg-admin-bg"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-0.5 flex size-[22px] items-center xl:top-[2.5px] xl:size-7 justify-center rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] transition-[left,background-color] motion-reduce:transition-none ${
          dark
            ? "left-[22px] bg-[#c5f23a] shadow-[0_1px_3px_rgba(0,0,0,0.35)] xl:left-[27px]"
            : "left-0.5 bg-white xl:left-[3px]"
        }`}
      >
        {dark ? <MoonGlyph /> : <SunGlyph />}
      </span>
    </button>
  );
}

function SunGlyph() {
  return (
    <svg viewBox="0 0 18 18" fill="none" className="size-3.5 xl:size-[18px]">
      <path
        d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z"
        stroke="#8DB51E"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M9 2.1V3.7M9 14.3V15.9M3.45 3.45L4.58 4.58M13.42 13.42L14.55 14.55M2.1 9H3.7M14.3 9H15.9M3.45 14.55L4.58 13.42M13.42 4.58L14.55 3.45"
        stroke="#8DB51E"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonGlyph() {
  return (
    <svg viewBox="0 0 14 14" fill="none" className="size-3.5 xl:size-[17.5px]">
      <path
        d="M11.4583 9.4583C10.5618 9.8064 9.5833 9.8862 8.6422 9.688C7.7011 9.4898 6.8379 9.0222 6.1578 8.3422C5.4778 7.6621 5.0102 6.7989 4.812 5.8578C4.6138 4.9167 4.6936 3.9382 5.0417 3.0417C4.2728 3.3402 3.5905 3.8258 3.0566 4.4544C2.5227 5.0831 2.1541 5.8351 1.9842 6.6422C1.8142 7.4493 1.8483 8.286 2.0833 9.0766C2.3183 9.8673 2.7468 10.5868 3.33 11.17C3.9132 11.7532 4.6327 12.1817 5.4234 12.4167C6.214 12.6517 7.0507 12.6858 7.8578 12.5158C8.6649 12.3459 9.4169 11.9773 10.0456 11.4434C10.6743 10.9095 11.1598 10.2272 11.4583 9.4583Z"
        fill="#2A2925"
      />
    </svg>
  );
}
