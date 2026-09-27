import { Roboto_Mono } from "next/font/google";
import { RoomMap, type RoomMate } from "./RoomMap";

// 호실 번호는 Figma대로 핸드폰 Roboto Mono SemiBold(600), 노트북 Regular(400). 루트는 400만 불러와
// 여기서 두 굵기를 함께 불러온다(같은 글꼴 안에서 font-semibold/font-normal로 고른다).
const roomNumberFont = Roboto_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
});

type MyRoomCardProps = {
  floor: number;
  roomNumber: string;
  /** 이름순으로 정렬된 호실 학생 */
  students: RoomMate[];
};

/**
 * REQ-UI-003 학생 홈 `내 호실` 카드(Figma 핸드폰 5:27, 노트북 224:56). 본인 호실만 읽기 전용으로 보인다.
 * `N인실`의 N은 DataGSM 배정 인원(고정 정원 아님), `M명 출석`은 지금 출석한 인원이다.
 * 호실 번호는 Figma대로 핸드폰 SemiBold 34px, 노트북 Regular 40px(두 프레임의 굵기가 다름).
 * 핸드폰 카드 아래 14px 빈 줄은 QR 버튼이 배치 그림을 덜 가리도록 Figma에 있는 여백이다.
 */
export function MyRoomCard({ floor, roomNumber, students }: MyRoomCardProps) {
  const present = students.filter((student) => student.present).length;

  return (
    <section
      aria-labelledby="my-room-title"
      className="flex min-h-0 flex-1 flex-col gap-3.5 rounded-[18px] bg-admin-surface p-[18px] md:gap-4 md:rounded-panel md:p-6"
    >
      <div className="flex items-center justify-between leading-normal">
        <h2
          id="my-room-title"
          className="text-[15px] font-bold text-admin-text md:text-base"
        >
          내 호실
        </h2>
        <p className="text-xs text-admin-textMuted md:text-[13px]">
          기숙사 {floor}층
        </p>
      </div>
      <div className="flex items-baseline gap-2.5 leading-normal md:gap-3">
        <p
          className={`${roomNumberFont.className} text-[34px] font-semibold tracking-[-0.68px] text-admin-text md:text-[40px] md:font-normal md:tracking-[-0.8px]`}
        >
          {roomNumber}
          <span className="sr-only">호</span>
        </p>
        <p className="text-[13px] text-admin-textMuted md:text-sm">
          {students.length}인실 · {present}명 출석
        </p>
      </div>
      <RoomMap students={students} />
      <div aria-hidden="true" className="h-3.5 shrink-0 md:hidden" />
    </section>
  );
}
