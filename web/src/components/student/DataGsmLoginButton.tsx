/**
 * REQ-AUTH-001 `DataGSM으로 계속하기` 버튼(Figma DG로그인버튼 252:470, 핸드폰·노트북 같은 300×48).
 * 색은 DataGSM 버튼 컴포넌트 값(page #f8fafc, line #e2e8f0, strong #0f172a) 그대로다.
 * 아이콘은 왼쪽 20px, 글자는 아이콘 오른쪽 남은 폭의 가운데(Figma 글자 위치와 같음).
 * Figma 인스턴스의 흰 사각 바탕은 둥근 모서리 밖 2px만 보이는 흔적이라 넣지 않았다.
 */
export function DataGsmLoginButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-[300px] max-w-full items-center rounded-md border border-[#e2e8f0] bg-[#f8fafc] pl-5 text-sm font-medium leading-normal text-[#0f172a]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- 14px 장식 아이콘이라 next/image 최적화가 필요 없다 */}
      <img
        src="/icons/login/datagsm.svg"
        alt=""
        aria-hidden="true"
        width={14}
        height={14}
        className="size-3.5 shrink-0"
      />
      <span className="flex-1 text-center">DataGSM으로 계속하기</span>
    </button>
  );
}
