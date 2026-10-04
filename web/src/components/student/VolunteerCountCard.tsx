/**
 * REQ-COM-003: 학생 본인의 남은 봉사 횟수 카드(Figma 핸드폰 319:291, 노트북 322:375). 봉사는 기숙사 벌칙이라
 * 앞으로 해야 할 횟수다(DEC-020·021) — Figma 문구 `누적 봉사 횟수`를 `남은 봉사 횟수`로 바꿨다(사용자 결정 2026-10-04).
 * 카드 아래 `활동 내역` 목록은 VolunteerHistoryItem이 맡는다. 줄 높이는 Figma 글자 상자(16px·41px)에 맞춰
 * 카드 높이가 113px이 되게 했다.
 */
export function VolunteerCountCard({ count }: { count: number }) {
  return (
    <div className="flex w-full flex-col items-center gap-1.5 rounded-[18px] border border-admin-attendance-border bg-admin-attendance-bg py-6">
      <p className="text-[13px] leading-4 text-admin-attendance-textMuted">
        남은 봉사 횟수
      </p>
      <p className="text-[34px] font-bold leading-[41px] text-admin-attendance-text md:tracking-[-0.68px]">
        {count}회
      </p>
    </div>
  );
}
