type StudentSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

/**
 * Figma 08 학생 관리의 검색창. 핸드폰·패드는 높이 44로 가로를 꽉 채우고(좌우 14·16, 간격 8), 컴퓨터는 420×46
 * (좌우 16, 간격 10)이며 높이 49 칸의 가운데에 놓인다.
 */
export function StudentSearchField({
  value,
  onChange,
}: StudentSearchFieldProps) {
  return (
    <div className="w-full xl:flex xl:h-[49px] xl:items-center">
      <label className="flex h-11 w-full items-center gap-2 rounded-control border border-admin-border bg-admin-rowSurface px-3.5 md:w-[290px] md:px-4 xl:h-[46px] xl:w-[420px] xl:gap-2.5 transition-colors focus-within:border-admin-textMuted focus-within:bg-admin-surface motion-reduce:transition-none">
        {/* eslint-disable-next-line @next/next/no-img-element -- Figma 검색 아이콘 원본 SVG */}
        <img
          src="/icons/admin/search.svg"
          alt=""
          aria-hidden="true"
          width={16}
          height={16}
          className="size-4 shrink-0"
        />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label="학생 검색"
          placeholder="이름, 학번 또는 호실로 검색"
          className="min-w-0 flex-1 bg-transparent text-sm leading-[17px] text-admin-text placeholder:text-admin-textMuted focus:outline-none"
        />
      </label>
    </div>
  );
}
