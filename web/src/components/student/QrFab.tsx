import Link from "next/link";

/**
 * 학생 홈 핸드폰의 QR 카메라 진입 버튼(Figma FAB · QR 5:67, REQ-UI-003 "QR 카메라 진입").
 * 62px 라임 원 안에 흰 28px QR 아이콘. Figma 위치 그대로 오른쪽 23px, 하단 탭바(67px) 위 35px에
 * 떠 있다(bottom 102px). 노트북은 사이드바 "QR 출석"으로 들어가므로 숨긴다.
 */
export function QrFab() {
  return (
    <Link
      href="/qr"
      aria-label="QR 출석"
      className="fixed bottom-[102px] right-[23px] z-30 flex size-[62px] items-center justify-center rounded-full bg-admin-accent-bg md:hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- 28px 정적 SVG라 next/image 최적화가 필요 없다 */}
      <img
        src="/icons/student-main/qr-fab.svg"
        alt=""
        aria-hidden="true"
        width={28}
        height={28}
        className="size-7"
      />
    </Link>
  );
}
