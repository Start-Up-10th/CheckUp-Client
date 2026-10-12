/**
 * 화면 모드 토글 그림(Figma ModeToggle 1278:46, 48×28). 라이트는 왼쪽 흰 손잡이에 해, 다크는 오른쪽 라임 손잡이에 달이다.
 * Figma 원본 SVG를 그대로 쓴다: 라이트는 마이페이지 줄에 놓인 것(1278:70, 회색 바탕), 다크는 컴포넌트의 Dark(1278:52).
 * 두 장을 다 넣고 CSS로 지금 모드의 것만 보여 첫 화면부터 맞는 쪽이 나온다. 누르는 동작과 역할(`switch`)은 감싸는 버튼이 맡는다.
 * Figma의 Smart Animate(손잡이가 미끄러지는 전환)는 넣지 않았고 바로 바뀐다.
 */
export function ModeToggle() {
  return (
    <span aria-hidden="true" className="block h-7 w-12 shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element -- 작은 정적 SVG라 next/image 최적화가 필요 없다 */}
      <img
        src="/icons/theme/mode-toggle-light.svg"
        alt=""
        width={48}
        height={28}
        className="size-full dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- 위와 같다 */}
      <img
        src="/icons/theme/mode-toggle-dark.svg"
        alt=""
        width={48}
        height={28}
        className="hidden size-full dark:block"
      />
    </span>
  );
}
