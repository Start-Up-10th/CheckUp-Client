import Link from "next/link";

type MainHeaderProps = {
  name: string;
  studentNumber: string;
  floor: number;
  hasUnreadNotification: boolean;
};

/**
 * REQ-UI-003 학생 홈 머리: `학번 · 이름`, `기숙사 N층` 제목, 알림 진입점(REQ-COM-005 — 읽지 않은
 * 알림이 있으면 종에 빨간 점, 숫자 배지 없음).
 * 핸드폰(Figma 5:4)은 흰 헤더, 위 여백은 상태바 56px+4px=60px(보이는 위치 그대로), 종 22px.
 * 노트북(224:41)은 배경 없이 제목 28px이고 종 버튼이 없다 — 알림은 사이드바 "알림"으로 들어간다
 * (팀원이 수정한 Figma, 2026-09-25, #29). 빨간 점 없는 종은 Figma에 없어 원본에서 점만 뺐고,
 * 핸드폰 종의 clip 밖 찌꺼기 원은 사이드바 종(#16)처럼 지웠다.
 */
export function MainHeader({
  name,
  studentNumber,
  floor,
  hasUnreadNotification,
}: MainHeaderProps) {
  const suffix = hasUnreadNotification ? "-unread" : "";
  return (
    <header className="flex items-center justify-between bg-admin-surface px-[22px] pb-4 pt-[60px] md:bg-transparent md:p-0">
      <div className="flex flex-col gap-0.5 leading-normal">
        <p className="text-[13px] text-admin-textMuted">
          {studentNumber} · {name}
        </p>
        <h1 className="text-[27px] font-bold tracking-[-0.81px] text-admin-text md:text-[28px] md:tracking-[-0.84px]">
          기숙사 {floor}층
        </h1>
      </div>
      <Link
        href="/notifications"
        aria-label={
          hasUnreadNotification ? "알림 (읽지 않은 알림 있음)" : "알림"
        }
        className="-m-2 p-2 md:hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- 빨간 점 색을 유지해야 해서 원본 SVG를 그대로 쓴다 */}
        <img
          src={`/icons/student-main/bell${suffix}.svg`}
          alt=""
          width={22}
          height={22}
          className="size-[22px]"
        />
      </Link>
    </header>
  );
}
