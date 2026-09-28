type RoomSeatCardProps = {
  name: string;
  /** 이름순 표시 순번(1부터). 침대 번호가 아니다(REQ-UI-003). */
  order: number;
  present: boolean;
};

/**
 * 학생 홈 호실 배치 그림의 학생 카드 한 칸(Figma 핸드폰 5:39, 노트북 224:68) — 왼쪽 세로 막대,
 * 굵은 이름, `N번 · 출석|미출석`(Roboto Mono). 출석은 연두, 미출석은 회색. 읽기 전용이다.
 * 핸드폰은 모서리 8·막대 12px·이름 11px, 노트북은 모서리 10·막대 4px·이름 13px(Figma 그대로).
 */
export function RoomSeatCard({ name, order, present }: RoomSeatCardProps) {
  return (
    <div
      className={`flex h-full min-w-0 flex-1 items-center gap-[7px] rounded-lg border px-[9px] py-[7px] md:gap-[9px] md:rounded-[10px] md:px-3 md:py-2.5 ${
        present
          ? "border-admin-attendance-border bg-admin-attendance-bg"
          : "border-admin-border bg-admin-rowSurface"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-full w-3 shrink-0 rounded md:w-1 ${
          present ? "bg-admin-attendance-border" : "bg-admin-border"
        }`}
      />
      <div className="flex min-w-0 flex-col gap-px leading-normal md:gap-0.5">
        <p
          className={`truncate text-[11px] font-bold md:text-[13px] ${
            present ? "text-admin-attendance-text" : "text-admin-textMuted"
          }`}
        >
          {name}
        </p>
        <p
          className={`font-mono text-[9px] md:text-[10px] ${
            present ? "text-admin-attendance-textMuted" : "text-admin-textFaint"
          }`}
        >
          {order}번 · {present ? "출석" : "미출석"}
        </p>
      </div>
    </div>
  );
}
