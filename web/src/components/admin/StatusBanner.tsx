type StatusBannerProps = {
  variant: "success" | "error" | "neutral";
  message: string;
  className?: string;
  /**
   * 테두리를 종류에 맞춘다(성공 라임·실패 분홍·안내 회색). 기본은 모든 종류가 분홍 테두리이고, 봉사 화면
   * (Figma 06·07 state messages)만 이 값을 켠다.
   */
  variantBorder?: boolean;
};

const VARIANT_BORDER = {
  success: "border-admin-attendance-border",
  error: "border-admin-danger-border",
  neutral: "border-admin-border",
} as const;

const VARIANT_STYLES = {
  success: {
    box: "border-admin-danger-border bg-admin-attendance-bg",
    dot: "bg-admin-attendance-text",
    text: "text-admin-attendance-text",
  },
  error: {
    box: "border-admin-danger-border bg-admin-danger-bg",
    dot: "bg-admin-danger-text",
    text: "text-admin-danger-text",
  },
  neutral: {
    box: "border-admin-danger-border bg-admin-rowSurface",
    dot: "bg-admin-textMuted",
    text: "text-admin-textMuted",
  },
} as const;

/** REQ-UI-006 공통 상태 배너: 가로 배너 + 점 아이콘. neutral은 명단 제외 등 담담한 안내에 쓴다(REQ-COM-001). */
export function StatusBanner({
  variant,
  message,
  className,
  variantBorder = false,
}: StatusBannerProps) {
  const style = VARIANT_STYLES[variant];
  const box = variantBorder
    ? style.box.replace("border-admin-danger-border", VARIANT_BORDER[variant])
    : style.box;
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`flex items-center gap-[9px] rounded-xl border px-3.5 py-3 ${box} ${className ?? ""}`}
    >
      <span className={`size-[7px] shrink-0 rounded-full ${style.dot}`} />
      <p className={`text-[13px] ${style.text}`}>{message}</p>
    </div>
  );
}
