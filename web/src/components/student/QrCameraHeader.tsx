import Link from "next/link";

/**
 * 핸드폰 QR 카메라 어두운 헤더 `‹ QR 카메라`(Figma 4:52). 다른 학생 헤더(StudentPageHeader)보다
 * 크고(‹ 24px 흰색 70%, 제목 22px) 어두운 화면용이라 따로 둔다. 위 여백은 Figma에서 보이는 위치
 * 그대로 상태바(56px)+6px=62px(마이페이지·봉사와 같은 기준). `‹`는 QR로 들어오는 홈(/main)으로 간다.
 * 노트북(228:39)은 헤더 대신 가운데 안내 제목을 쓰므로 여기서는 숨긴다.
 */
export function QrCameraHeader() {
  return (
    <header className="flex items-center gap-3 px-[22px] pb-[18px] pt-[62px] md:hidden">
      <Link
        href="/main"
        aria-label="뒤로 가기"
        className="-m-2 p-2 text-2xl leading-none text-white/70"
      >
        ‹
      </Link>
      <h1 className="text-[22px] font-bold leading-normal tracking-[-0.66px] text-white">
        QR 카메라
      </h1>
    </header>
  );
}
