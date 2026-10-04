import type { CurrentStudentProfile } from "@/lib/student/current-student";

type MyProfileProps = {
  /** 본인 정보. 받기 전이거나 받지 못했으면 null이고, 글자 자리는 비워 둔다(높이는 유지). */
  profile: CurrentStudentProfile | null;
};

/** `2405 · 기숙사 4층 412호`. 호실이 배정되지 않았으면 Figma에 없어 `2405 · 호실 미배정`으로 쓴다. */
function profileDetail({
  studentNumber,
  floor,
  roomNumber,
}: CurrentStudentProfile): string {
  return floor === null || roomNumber === null
    ? `${studentNumber} · 호실 미배정`
    : `${studentNumber} · 기숙사 ${floor}층 ${roomNumber}호`;
}

/**
 * REQ-UI-004 마이페이지 프로필: 이름 아래 `학번 · 기숙사 N층 NNN호`.
 * 핸드폰(Figma 6:5)은 흰 헤더에 "마이페이지" 제목을 함께 두고, 위 여백은 Figma에서 보이는
 * 위치 그대로 상태바(56px)+4px=60px이다(사용자 결정). 노트북(227:41)은 제목 없이 흰 카드다.
 * 프로필 사진은 기본값이 비어 있어(REQ-AUTH-005) 표시하지 않는다.
 */
export function MyProfile({ profile }: MyProfileProps) {
  return (
    <section className="bg-admin-surface px-[22px] pb-[22px] pt-[60px] md:rounded-panel md:p-7">
      <h1 className="pb-5 text-[27px] font-bold leading-normal tracking-[-0.81px] text-admin-text md:hidden">
        마이페이지
      </h1>
      <div className="flex flex-col gap-[5px] leading-normal md:gap-1">
        <p className="text-2xl font-bold tracking-[-0.48px] text-admin-text md:text-[22px] md:tracking-[-0.44px]">
          {profile ? profile.name : "\u00a0"}
        </p>
        <p className="text-sm text-admin-textMuted">
          {profile ? profileDetail(profile) : "\u00a0"}
        </p>
      </div>
    </section>
  );
}
