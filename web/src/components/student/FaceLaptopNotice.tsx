/**
 * REQ-FACE-001: 노트북에서는 카메라를 열지 않고 이 안내만 보여 준다(Figma 사용자-노트북 604:8).
 * 연회색 상자(모서리 16px, 좌우 48px·위아래 56px) 안에 22px 제목과 15px 설명.
 */
export function FaceLaptopNotice() {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-2xl bg-admin-rowSurface px-12 py-14 text-center leading-normal">
      <h1 className="text-[22px] font-bold text-admin-text">
        얼굴 등록은 휴대폰에서만 가능해요
      </h1>
      <p className="text-[15px] text-admin-textMuted">
        휴대폰으로 DataGSM 로그인 후 얼굴을 등록해 주세요.
      </p>
    </div>
  );
}
