export type QrResultVariant = "success" | "error" | "neutral";

const VARIANT_STYLES: Record<
  QrResultVariant,
  { box: string; text: string; mark: string }
> = {
  // ✓ 승인되었습니다 (Figma 4:73)
  success: {
    box: "border-admin-border bg-admin-surface",
    text: "font-bold text-admin-attendance-text",
    mark: "",
  },
  // 만료된 QR입니다 등 실패 (Figma 4:77)
  error: {
    box: "border-admin-danger-border bg-admin-danger-bg",
    text: "text-admin-danger-text",
    mark: "bg-admin-danger-text",
  },
  // 이미 출석 처리된 QR입니다 등 담담한 안내 (Figma 4:80)
  neutral: {
    box: "border-admin-border bg-admin-ghost-bg",
    text: "text-admin-ghost-text",
    mark: "bg-admin-textMuted",
  },
};

/**
 * REQ-ATT-005 QR 스캔 결과 메시지(Figma 05 · QR 카메라 state messages 4:71, 토스트 767:77).
 * 승인은 초록 원 안의 ✓, 나머지는 7px 점. 관리자 StatusBanner와 색·표시가 달라 따로 만든다.
 * 위치(화면 아래)와 사라지는 시간은 화면이 정한다.
 */
export function QrResultToast({
  variant,
  message,
}: {
  variant: QrResultVariant;
  message: string;
}) {
  const style = VARIANT_STYLES[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`flex w-full items-center gap-2.5 rounded-control border px-3.5 py-3 leading-normal ${style.box}`}
    >
      {variant === "success" ? (
        <span
          aria-hidden="true"
          className="flex size-5 shrink-0 items-center justify-center rounded-[10px] bg-admin-attendance-text text-[11px] font-bold text-white"
        >
          ✓
        </span>
      ) : (
        <span
          aria-hidden="true"
          className={`size-[7px] shrink-0 rounded-full ${style.mark}`}
        />
      )}
      <p className={`text-[13px] ${style.text}`}>{message}</p>
    </div>
  );
}
