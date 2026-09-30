type AttendanceStatCardsProps = {
  present: number;
  absent: number;
};

/**
 * REQ-UI-001: 출석/미출석 2개 카드만 표시한다. 총원 통계 카드는 추가하지 않는다.
 *
 * Figma 실제 디자인 토큰 대조(2026-10):
 * - 핸드폰(280:26): 세로 스택 · p-3 · rounded-[12px] · 라벨 회색 10px · 출석 숫자 진한 올리브 18px · 미출석 숫자 검정 18px · 미출석 테두리 없음.
 * - 패드(52:53): 가로(items-baseline justify-between) · px-4 py-[14px] · rounded-[14px] · 라벨 올리브 12px · 숫자 진한 올리브 22px · 두 카드 모두 초록 테두리(#dcefad).
 * - 데스크톱(16:445): 세로 스택 · px-[18px] py-[16px] · rounded-2xl(16) · 라벨 회색 12px · 숫자 검정 24px · 미출석 테두리 없음.
 *
 * xl(≥1280)의 padding·rounded·숫자 크기는 vw 기반으로 선형 스케일. 노트북(1280)에서
 * Figma 1920 픽셀을 그대로 쓰면 상대적으로 너무 커 보이므로, 1280~1920 사이에서 뷰포트
 * 폭에 비례해 픽셀을 늘린다. 1920에서 Figma 원본에 도달.
 */
export function AttendanceStatCards({
  present,
  absent,
}: AttendanceStatCardsProps) {
  return (
    <div className="flex w-full items-start gap-2 md:gap-7 xl:gap-[calc(14px*100vw/1920)]">
      <div className="flex flex-1 flex-col gap-1 rounded-xl border border-admin-attendance-border bg-admin-attendance-bg p-3 md:flex-row md:items-baseline md:justify-between md:rounded-[14px] md:px-4 md:py-[14px] xl:flex-col xl:items-start xl:justify-normal xl:rounded-[calc(16px*100vw/1920)] xl:px-[calc(18px*100vw/1920)] xl:py-[calc(16px*100vw/1920)]">
        <p className="text-[10px] leading-[12px] text-admin-textMuted md:text-xs md:leading-[14px] md:text-admin-attendance-textMuted xl:text-admin-textMuted">
          출석
        </p>
        <p className="text-lg font-bold leading-[22px] text-admin-attendance-text md:text-[22px] md:leading-normal xl:text-[calc(24px*100vw/1920)] xl:text-admin-text">
          {present}
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-1 rounded-xl bg-admin-surface p-3 md:flex-row md:items-baseline md:justify-between md:rounded-[14px] md:border md:border-admin-attendance-border md:px-4 md:py-[14px] xl:flex-col xl:items-start xl:justify-normal xl:rounded-[calc(16px*100vw/1920)] xl:border-0 xl:px-[calc(18px*100vw/1920)] xl:py-[calc(16px*100vw/1920)]">
        <p className="text-[10px] leading-[12px] text-admin-textMuted md:text-xs md:leading-[14px] md:text-admin-attendance-textMuted xl:text-admin-textMuted">
          미출석
        </p>
        <p className="text-lg font-bold leading-[22px] text-admin-text md:text-[22px] md:leading-normal md:text-admin-attendance-text xl:text-[calc(24px*100vw/1920)] xl:text-admin-text">
          {absent}
        </p>
      </div>
    </div>
  );
}
