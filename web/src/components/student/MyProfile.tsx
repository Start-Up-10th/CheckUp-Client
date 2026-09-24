type MyProfileProps = {
  name: string;
  studentNumber: string;
  floor: number;
  roomNumber: string;
};

/**
 * REQ-UI-004 마이페이지 프로필: 이름 아래 `학번 · 기숙사 N층 NNN호`.
 * 핸드폰(Figma 6:5)은 흰 헤더에 "마이페이지" 제목을 함께 두고, 위 여백은 Figma에서 보이는
 * 위치 그대로 상태바(56px)+4px=60px이다(사용자 결정). 노트북(227:41)은 제목 없이 흰 카드다.
 * 프로필 사진은 기본값이 비어 있어(REQ-AUTH-005) 표시하지 않는다.
 */
export function MyProfile({
  name,
  studentNumber,
  floor,
  roomNumber,
}: MyProfileProps) {
  return (
    <section className="bg-admin-surface px-[22px] pb-[22px] pt-[60px] md:rounded-panel md:p-7">
      <h1 className="pb-5 text-[27px] font-bold leading-normal tracking-[-0.81px] text-admin-text md:hidden">
        마이페이지
      </h1>
      <div className="flex flex-col gap-[5px] leading-normal md:gap-1">
        <p className="text-2xl font-bold tracking-[-0.48px] text-admin-text md:text-[22px] md:tracking-[-0.44px]">
          {name}
        </p>
        <p className="text-sm text-admin-textMuted">
          {studentNumber} · 기숙사 {floor}층 {roomNumber}호
        </p>
      </div>
    </section>
  );
}
