import Link from "next/link";

type MenuRowProps = { label: string } & (
  { href: string; onClick?: never } | { onClick: () => void; href?: never }
);

const ROW_CLASS =
  "flex w-full items-center justify-between rounded-2xl bg-admin-surface transition-colors hover:bg-admin-divider px-[18px] py-[17px] text-[15px] leading-normal md:px-5 md:py-[18px]";

/**
 * 마이페이지 메뉴 한 줄 — 왼쪽 글자, 오른쪽 `›`(Figma 핸드폰 297:5, 노트북 297:11).
 * `href`면 줄 전체가 링크다(`봉사 활동` → /volunteer, REQ-UI-004). `onClick`이면 같은 모양의 버튼으로,
 * `얼굴 재설정`(Figma 핸드폰 1274:34·노트북 1275:44)이 이동 전에 확인 창을 띄우는 데 쓴다(DEC-105).
 */
export function MenuRow({ href, onClick, label }: MenuRowProps) {
  const content = (
    <>
      <span className="text-admin-text">{label}</span>
      <span
        aria-hidden="true"
        className="text-[#b9b9be] dark:text-admin-textFaint"
      >
        ›
      </span>
    </>
  );

  return href !== undefined ? (
    <Link href={href} className={ROW_CLASS}>
      {content}
    </Link>
  ) : (
    <button
      type="button"
      onClick={onClick}
      className={`${ROW_CLASS} text-left`}
    >
      {content}
    </button>
  );
}
