type StatusBannerProps = {
  variant: "success" | "error" | "neutral";
  message: string;
  className?: string;
};

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
}: StatusBannerProps) {
  const style = VARIANT_STYLES[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`flex items-center gap-[9px] rounded-xl border px-3.5 py-3 ${style.box} ${className ?? ""}`}
    >
      <span className={`size-[7px] shrink-0 rounded-full ${style.dot}`} />
      <p className={`text-[13px] ${style.text}`}>{message}</p>
    </div>
  );
}
