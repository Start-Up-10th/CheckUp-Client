type StatusBannerProps = {
  variant: "success" | "error" | "neutral";
  message: string;
  className?: string;
  /**
   * 핸드폰 폭(<md)에서 글자 12px·여백·모서리·점을 줄인다. Figma 상태 메시지에는 핸드폰 전용 크기가 없어 봉사 화면만
   * 켠다(기본 꺼짐). 패드 이상은 같은 크기다.
   */
  compactOnPhone?: boolean;
};

const VARIANT_STYLES = {
  success: {
    box: "border-admin-attendance-border bg-admin-attendance-bg",
    dot: "bg-admin-attendance-text",
    text: "text-admin-attendance-text",
  },
  error: {
    box: "border-admin-danger-border bg-admin-danger-bg",
    dot: "bg-admin-danger-text",
    text: "text-admin-danger-text",
  },
  neutral: {
    box: "border-admin-border bg-admin-rowSurface",
    dot: "bg-admin-textMuted",
    text: "text-admin-textMuted",
  },
} as const;

/**
 * REQ-UI-006 공통 상태 배너: 가로 배너 + 점 아이콘. 높이는 Figma 상태 메시지대로 42px(안여백 14×12, 글자 줄 16)다. 테두리는 종류별이다(성공 라임·실패 분홍·안내 회색, Figma
 * 02 패드·핸드폰, 06, 07 state messages).
 * neutral은 명단 제외 등 담담한 안내에 쓴다(REQ-COM-001). */
export function StatusBanner({
  variant,
  message,
  className,
  compactOnPhone = false,
}: StatusBannerProps) {
  const style = VARIANT_STYLES[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`flex items-center border ${
        compactOnPhone
          ? "gap-2 rounded-[10px] px-3 py-2.5 md:gap-[9px] md:rounded-xl md:px-3.5 md:py-3"
          : "gap-[9px] rounded-xl px-3.5 py-3"
      } ${style.box} ${className ?? ""}`}
    >
      <span
        className={`shrink-0 rounded-full ${compactOnPhone ? "size-1.5 md:size-[7px]" : "size-[7px]"} ${style.dot}`}
      />
      <p
        className={`${compactOnPhone ? "text-xs leading-4 md:text-[13px] md:leading-4" : "text-[13px] leading-4"} ${style.text}`}
      >
        {message}
      </p>
    </div>
  );
}
