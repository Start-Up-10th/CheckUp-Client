/**
 * 얼굴 촬영 중 고개 방향 안내(사용자 요청 2026-10-13, DEC-083). 카메라 화면 위, 단계 안내 알약 바로 위에 보인다.
 * 카메라 영상 위라 어두운 반투명 바탕에 흰 글씨로 읽히게 한다. Figma에 없는 문구라 알약과 같은 크기·모양으로 맞췄다.
 * 카운트다운(미리 알림)과 촬영 중에 보이고 완료 단계에서는 보이지 않는다. 낭독기는 단계 안내(`role="status"`)가 읽는다.
 */
export function FaceTurnGuide() {
  return (
    <p className="rounded-full bg-black/55 px-4 py-2.5 text-[13px] font-medium leading-normal text-white md:px-6 md:py-3.5 md:text-base">
      고개를 상하좌우로 천천히 돌려 주세요
    </p>
  );
}
