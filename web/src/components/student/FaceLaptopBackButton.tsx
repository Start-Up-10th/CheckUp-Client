"use client";

import { useRouter } from "next/navigation";

/**
 * 노트북 얼굴 등록 안내 화면의 뒤로가기(Figma 사용자-노트북 03 · 얼굴 촬영 239:2, `Arrow / Chevron_Left` 35×35).
 * 화면 왼쪽·위에서 35px 자리에 회색 `‹` 아이콘만 둔다. 누르면 로그인 화면(`/login`)으로 간다(사용자 결정, DEC-060).
 * 노트북(md 이상)에서만 보이는 안내 화면에 쓴다.
 */
export function FaceLaptopBackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.replace("/login")}
      aria-label="뒤로 가기"
      className="absolute left-[35px] top-[35px] hidden size-[35px] md:block"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- 35px 장식 아이콘이라 next/image 최적화가 필요 없다 */}
      <img
        src="/icons/student/chevron-left.svg"
        alt=""
        aria-hidden="true"
        width={35}
        height={35}
        className="size-[35px]"
      />
    </button>
  );
}
