/**
 * REQ-UI-006 공통 오류/재시도 — 학생 화면 목록·조회 실패 시 내용 자리를 대신한다
 * (Figma 봉사 활동 오류: 핸드폰 459:991 354×260, 노트북 460:218 640×300, 흰 배경).
 * 경고 아이콘은 관리자 화면과 같은 public/icons/state-error.svg이고, 모양도 관리자
 * 최근 인식 오류(RecentRecognitionsList의 StateMessage)와 같은 Figma 값이다.
 */
export function StudentErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex min-h-[260px] w-full flex-col items-center justify-center gap-4 bg-admin-surface text-center leading-normal md:min-h-[300px]"
    >
      <span className="flex size-[72px] items-center justify-center rounded-full bg-admin-danger-bg">
        {/* eslint-disable-next-line @next/next/no-img-element -- 32px 정적 SVG라 next/image 최적화가 필요 없다 */}
        <img
          src="/icons/state-error.svg"
          alt=""
          aria-hidden="true"
          width={32}
          height={32}
          className="size-8"
        />
      </span>
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-[19px] font-bold text-admin-text">
          불러오지 못했어요
        </p>
        <p className="text-sm text-admin-textMuted">
          네트워크 연결을 확인하고 다시 시도해 주세요.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-control bg-admin-text px-6 py-[13px] text-[15px] text-white"
      >
        다시 시도
      </button>
    </div>
  );
}
