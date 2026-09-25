const CORNERS = [
  "left-0 top-0 rounded-tl-[26px] border-l-[3px] border-t-[3px]",
  "right-0 top-0 rounded-tr-[26px] border-r-[3px] border-t-[3px]",
  "bottom-0 left-0 rounded-bl-[26px] border-b-[3px] border-l-[3px]",
  "bottom-0 right-0 rounded-br-[26px] border-b-[3px] border-r-[3px]",
];

/**
 * REQ-FACE-001의 코너 가이드 — Figma 얼굴 촬영 화면에는 없어 명세대로 추가했다(사용자 결정).
 * 모양은 QR 스캔 가이드와 같은 계열(라임 #b9ee84, 선 3px, 모서리 26px, 코너 44px)이고,
 * 얼굴 비율에 맞춰 세로로 긴 260×320px로 정했다(Figma에 없는 값). 가운데 내용(카운트다운 숫자)을 품는다.
 */
export function FaceGuideFrame({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative flex h-[320px] w-[260px] items-center justify-center">
      {CORNERS.map((position) => (
        <span
          key={position}
          aria-hidden="true"
          className={`absolute size-11 border-admin-accent-bg ${position}`}
        />
      ))}
      {children}
    </div>
  );
}
