import Link from "next/link";

type VolunteerDesignatedBarProps = { count: number };

/**
 * Figma 07 하단 바 `당일 지정 N명 · 봉사자 관리 →`. 오늘 지정된 사람이 있을 때만 보이고 화면 아래에 떠 있다.
 * 핸드폰은 358×52(하단 바 위 12px), 패드는 콘텐츠 폭 628×56(아래 20px), 컴퓨터는 가운데 560×62(아래 28px)다.
 */
export function VolunteerDesignatedBar({ count }: VolunteerDesignatedBarProps) {
  return (
    <div className="absolute inset-x-4 bottom-3 z-10 flex h-[52px] items-center justify-between rounded-[14px] border border-admin-border bg-admin-surface py-2 pl-4 pr-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.08)] md:inset-x-[22px] md:bottom-5 md:h-14 md:rounded-2xl md:py-2.5 md:pl-5 md:pr-3 xl:inset-x-auto xl:bottom-7 xl:left-1/2 xl:h-[62px] xl:w-[560px] xl:-translate-x-1/2">
      <p className="text-[13px] leading-4 text-admin-textSecondary xl:text-sm xl:leading-[17px]">
        당일 지정 <span className="font-bold text-admin-text">{count}명</span>
      </p>
      <Link
        href="/admin/volunteers"
        className="rounded-[10px] bg-admin-accent-bg px-3.5 py-2.5 text-[13px] font-bold leading-4 text-admin-accent-text md:rounded-xl md:px-4 md:py-[11px] xl:px-5 xl:py-3 xl:text-sm xl:leading-[17px]"
      >
        봉사자 관리 →
      </Link>
    </div>
  );
}
