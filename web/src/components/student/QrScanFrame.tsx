import type { Ref } from "react";

const CORNERS = [
  { key: "tl", className: "left-0 top-0" },
  { key: "tr", className: "right-0 top-0" },
  { key: "bl", className: "bottom-0 left-0" },
  { key: "br", className: "bottom-0 right-0" },
] as const;

/**
 * REQ-ATT-005 QR 스캔 영역 — 반투명 흰 사각형(white 6%, 모서리 26px) 안에 카메라 영상,
 * 네 귀퉁이에 초록 코너 가이드. 핸드폰(Figma 4:56) 280px·가이드 44px, 노트북(228:41)
 * 300px·가이드 48px. 두 크기의 가이드는 곡선 모양이 달라 Figma SVG를 각각 쓴다.
 * 영상은 거울처럼 뒤집지 않는다(뒤 카메라로 QR을 보는 화면이라 좌우가 실제와 같아야 한다).
 */
export function QrScanFrame({ videoRef }: { videoRef: Ref<HTMLVideoElement> }) {
  return (
    <div className="relative size-[280px] shrink-0 md:size-[300px]">
      <div className="absolute inset-0 overflow-hidden rounded-[26px] bg-white/[0.06]">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          aria-label="QR 카메라 화면"
          className="size-full object-cover"
        />
      </div>
      {CORNERS.map(({ key, className }) => (
        <span key={key} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element -- 정적 코너 SVG라 next/image 최적화가 필요 없다 */}
          <img
            src={`/icons/qr-bracket/phone-${key}.svg`}
            alt=""
            width={44}
            height={44}
            className={`absolute size-11 md:hidden ${className}`}
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- 정적 코너 SVG라 next/image 최적화가 필요 없다 */}
          <img
            src={`/icons/qr-bracket/laptop-${key}.svg`}
            alt=""
            width={48}
            height={48}
            className={`absolute hidden size-12 md:block ${className}`}
          />
        </span>
      ))}
    </div>
  );
}
