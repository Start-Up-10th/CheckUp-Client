/**
 * QR 카메라의 앞·뒤 카메라 전환 버튼(REQ-ATT-005, DEC-081). Figma 학생 `05 · QR 카메라`(4:43, 228:2)에 없어
 * 작업자가 정했다: 40px 원(흰색 10%), 흰색 70% 선 아이콘, 오른쪽 위. 핸드폰은 `‹ QR 카메라` 헤더 줄 높이에 맞추고
 * (오른쪽 22px), 노트북은 화면 오른쪽 위 24px이다. 카메라가 하나뿐이면 부르는 쪽에서 그리지 않는다.
 */
export function QrCameraSwitchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="카메라 전환"
      className="absolute right-[22px] top-[58px] flex size-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/15 hover:text-white xl:right-6 xl:top-6"
    >
      <svg
        aria-hidden="true"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" />
        <path d="M4 4v4h4" />
        <path d="M4 13a8 8 0 0 0 14.3 4.9L20 16" />
        <path d="M20 20v-4h-4" />
      </svg>
    </button>
  );
}
