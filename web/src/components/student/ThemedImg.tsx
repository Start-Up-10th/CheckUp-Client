/**
 * 색이 정해진 원본 SVG를 화면 모드마다 다른 파일로 보여 준다(REQ-UI-008). 빨간 점처럼 색을 유지해야 해서
 * mask(MaskIcon)를 못 쓰는 아이콘에 쓴다. 두 장을 다 넣고 CSS로 하나만 보이게 해서 첫 화면부터 맞는 쪽이 나온다.
 */
export function ThemedImg({
  lightSrc,
  darkSrc,
  size,
}: {
  lightSrc: string;
  darkSrc: string;
  size: number;
}) {
  const style = { width: size, height: size };
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- 작은 정적 SVG라 next/image 최적화가 필요 없다 */}
      <img
        src={lightSrc}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        style={style}
        className="shrink-0 dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- 위와 같다 */}
      <img
        src={darkSrc}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        style={style}
        className="hidden shrink-0 dark:block"
      />
    </>
  );
}
