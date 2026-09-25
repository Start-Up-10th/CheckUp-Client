/**
 * 알림 목록을 불러오는 동안 보이는 회색 막대 5개(Figma 핸드폰 468:324~328, 노트북 468:450~454).
 * 막대 높이 52px·모서리 12px·#e7e7e9, 간격은 핸드폰 16px·노트북 20px로 Figma 값 그대로다.
 * 화면 낭독기에는 바깥 `role="status"`로 "불러오는 중"을 알린다(봉사 횟수 로딩과 같은 방식).
 */
export function NoticeListSkeleton() {
  return (
    <div role="status" aria-label="알림을 불러오는 중">
      <div aria-hidden="true" className="flex flex-col gap-4 md:gap-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-[52px] rounded-control bg-[#e7e7e9]" />
        ))}
      </div>
    </div>
  );
}
