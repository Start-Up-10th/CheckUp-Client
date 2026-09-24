/**
 * 동의 화면의 원형 체크 표시(Figma 622:37 꺼짐, 622:9 켜짐). 핸드폰 22px, 노트북 26px.
 * 노트북 SVG(605:64)는 같은 그림을 키운 것이라 파일을 나누지 않고 크기만 바꾼다.
 * 노트북의 전체 동의 체크(626:9)만 24px로 그려져 있으나 26px로 통일했다(사용자 결정).
 * 누르는 영역은 항목 줄 전체라서 이 컴포넌트는 모양만 그린다 — 체크 상태는
 * 부모(항목 카드·전체 동의 줄)가 `role="checkbox"`로 스크린리더에 알린다.
 */
export function ConsentCheckbox({ checked }: { checked: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 22px 정적 SVG라 next/image 최적화가 필요 없다
    <img
      src={
        checked ? "/icons/consent/check-on.svg" : "/icons/consent/check-off.svg"
      }
      alt=""
      aria-hidden="true"
      width={22}
      height={22}
      className="size-[22px] shrink-0 md:size-[26px]"
    />
  );
}
