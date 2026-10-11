import Link from "next/link";

type MenuRowProps = {
  href: string;
  label: string;
};

/**
 * 마이페이지 메뉴 한 줄 — 왼쪽 글자, 오른쪽 `›`(Figma 핸드폰 297:5, 노트북 297:11).
 * 줄 전체가 링크다. `봉사 활동`(→ /volunteer, REQ-UI-004)과 `얼굴 재설정`(→ /face?reset=1, Figma 핸드폰 1274:34·노트북 1275:44)이 쓴다.
 */
export function MenuRow({ href, label }: MenuRowProps) {
  return (
    <Link
      href={href}
      className="flex w-full items-center justify-between rounded-2xl bg-admin-surface transition-colors hover:bg-admin-divider px-[18px] py-[17px] text-[15px] leading-normal md:px-5 md:py-[18px]"
    >
      <span className="text-admin-text">{label}</span>
      <span aria-hidden="true" className="text-[#b9b9be]">
        ›
      </span>
    </Link>
  );
}
