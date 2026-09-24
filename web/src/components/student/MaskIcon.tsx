/**
 * 원본 SVG 모양에 글자색(currentColor)을 입혀 그린다 — 활성/비활성 색을 CSS로 바꾸기 위해
 * 관리자 탭바(AdminBottomTabBar)의 TabIcon과 같은 mask 방식을 쓴다. 크기는 className으로 정한다.
 */
export function MaskIcon({
  src,
  className,
}: {
  src: string;
  className: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`block shrink-0 bg-current ${className}`}
      style={{
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        maskSize: "contain",
        WebkitMaskSize: "contain",
      }}
    />
  );
}
