import Link from "next/link";

type StudentPageHeaderProps = {
  title: string;
  /** 핸드폰 `‹`를 눌렀을 때 갈 화면 */
  backHref: string;
};

/**
 * REQ-UI-004: QR 카메라·봉사·알림 화면의 `뒤로가기 + 제목` 헤더.
 * 핸드폰(Figma 319:287)은 `‹ 제목`, 위 여백은 Figma에서 보이는 위치 그대로 상태바(50px)+8px=58px
 * (마이페이지와 같은 기준). 노트북(322:374)은 사이드바로 이동하므로 `‹` 없이 24px 제목만 둔다.
 * 줄 높이는 Figma 글자 상자(`‹` 26px·제목 22px, 노트북 제목 29px)에 맞춰 본문이 Figma 위치(핸드폰 100px)에서 시작한다.
 */
export function StudentPageHeader({ title, backHref }: StudentPageHeaderProps) {
  return (
    <header className="flex items-center gap-2.5 px-[18px] pb-4 pt-[58px] md:p-0">
      <Link
        href={backHref}
        aria-label="뒤로 가기"
        className="-m-2 p-2 text-[22px] leading-[26px] text-admin-text md:hidden"
      >
        ‹
      </Link>
      <h1 className="text-lg font-bold leading-[22px] text-admin-text md:text-2xl md:leading-[29px] md:tracking-[-0.48px]">
        {title}
      </h1>
    </header>
  );
}
