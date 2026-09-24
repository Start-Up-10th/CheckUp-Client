/**
 * REQ-COM-003: 학생 본인의 누적 봉사 횟수 카드(Figma 핸드폰 319:291, 노트북 322:375).
 * 학생은 누적 횟수만 본다(DEC-014) — Figma의 "활동 내역" 목록은 이 결정 이전 디자인이라 만들지 않는다.
 */
export function VolunteerCountCard({ count }: { count: number }) {
  return (
    <div className="flex w-full flex-col items-center gap-1.5 rounded-[18px] border border-admin-attendance-border bg-admin-attendance-bg py-6 leading-normal">
      <p className="text-[13px] text-admin-attendance-textMuted">
        누적 봉사 횟수
      </p>
      <p className="text-[34px] font-bold text-admin-attendance-text md:tracking-[-0.68px]">
        {count}회
      </p>
    </div>
  );
}

/**
 * 불러오는 동안 카드 자리에 보이는 회색 막대. 색은 Figma 로딩 막대(459:943, #e7e7e9) 그대로이고,
 * 모양은 활동 목록을 빼면서 카드 하나와 같게 했다(사용자 결정). 높이가 카드와 똑같도록
 * 같은 글자를 투명하게 넣어 둔다.
 */
export function VolunteerCountCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex w-full flex-col items-center gap-1.5 rounded-[18px] border border-transparent bg-[#e7e7e9] py-6 leading-normal text-transparent"
    >
      <p className="text-[13px]">누적 봉사 횟수</p>
      <p className="text-[34px] font-bold">0회</p>
    </div>
  );
}
