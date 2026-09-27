/**
 * 봉사 활동을 불러오는 동안 보이는 회색 막대 6개(Figma 핸드폰 459:943~948, 노트북 460:73~78).
 * 누적 횟수 카드·`활동 내역` 제목 없이 막대만 있다(Figma loading 프레임에서 둘 다 숨김).
 * 막대 높이 52px·모서리 12px·#e7e7e9, 간격은 핸드폰 16px·노트북 20px로 Figma 값 그대로다.
 * 화면 낭독기에는 바깥 `role="status"`로 "불러오는 중"을 알린다(알림 로딩과 같은 방식).
 */
export function VolunteerHistorySkeleton() {
  return (
    <div role="status" aria-label="봉사 활동을 불러오는 중">
      <div aria-hidden="true" className="flex flex-col gap-4 md:gap-5">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-[52px] rounded-control bg-[#e7e7e9]" />
        ))}
      </div>
    </div>
  );
}
