import { QRCodeSVG } from "qrcode.react";

type QrCodeGenerationPanelProps = {
  qrValue: string;
  countdownLabel: string;
};

/** REQ-ATT-003/004: QR과 "남은 유효 시간" mm:ss만 보여준다 — 생성/종료 버튼, 확인 모달은 없다. */
export function QrCodeGenerationPanel({
  qrValue,
  countdownLabel,
}: QrCodeGenerationPanelProps) {
  return (
    <div className="flex h-full w-full flex-1 items-center justify-center rounded-[18px] bg-admin-surface md:rounded-panel">
      <div className="flex flex-col items-center gap-[18px] md:gap-4">
        <div className="flex size-[180px] items-center justify-center overflow-hidden md:size-[min(300px,70vw)] md:rounded-[18px] md:border md:border-admin-border">
          <QRCodeSVG value={qrValue} size={298} className="size-full" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="font-mono text-[11px] leading-[15px] tracking-[1.76px] text-admin-textFaint md:leading-normal">
            남은 유효 시간
          </p>
          <p className="font-sans text-[38px] font-bold leading-[46px] tracking-[-1.14px] text-admin-text md:font-mono md:leading-normal">
            {countdownLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
