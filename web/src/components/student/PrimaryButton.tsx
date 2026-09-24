type PrimaryButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
};

/**
 * 학생 화면 하단의 54px 전체 폭 초록 버튼(Figma 605:47 "동의하고 계속하기").
 * 모서리는 Figma 값 15px을 그대로 쓴다(사용자 결정, rounded-control 12px와 다름).
 * 비활성 상태는 Figma에 없어 관리자 "−" 비활성 색(#ebebed/#d5d5d8)을 쓴다(사용자 결정).
 */
export function PrimaryButton({
  children,
  onClick,
  disabled = false,
}: PrimaryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-[54px] w-full shrink-0 items-center justify-center rounded-[15px] text-[15px] font-bold leading-normal ${
        disabled
          ? "bg-admin-divider text-[#d5d5d8]"
          : "bg-admin-accent-bg text-admin-accent-text"
      }`}
    >
      {children}
    </button>
  );
}
