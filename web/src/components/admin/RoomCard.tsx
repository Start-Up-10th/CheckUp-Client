import { roomAttendance, type Room } from "@/lib/admin/floor-types";

type RoomCardProps = {
  room: Room;
  onClick?: (room: Room) => void;
};

/**
 * REQ-UI-001: 전원 출석은 라임 계열, 일부 미출석과 등록한 학생이 없는 호실(0/0)은 회색 계열로 구분한다.
 * 폰(Figma 관리자-핸드폰)은 호실 번호를 가운데에, 패드·컴퓨터는 호실 번호와 출석 인원을 한 줄에 보여준다.
 * 그 아래에 학생 이름과 출석 점(출석 연두·미출석 회색)을 보인다(DEC-114).
 */
export function RoomCard({ room, onClick }: RoomCardProps) {
  const { assigned, present } = roomAttendance(room);
  // 등록한 학생이 없는 호실(0/0)은 전원 출석이 아니라 회색이다(DEC-059).
  const fullyPresent = assigned > 0 && present >= assigned;

  const students = room.students ?? [];

  return (
    <button
      type="button"
      onClick={onClick ? () => onClick(room) : undefined}
      className={`flex min-w-0 flex-col items-stretch justify-center gap-1 overflow-hidden rounded-[10px] border px-1.5 py-1.5 text-center [@media(max-height:620px)]:py-1 md:[@media(max-height:620px)]:py-[11px] transition hover:brightness-95 md:justify-start md:gap-1 md:rounded-[12px] md:p-[11px] md:text-left xl:aspect-auto xl:h-full xl:gap-2 xl:rounded-card xl:p-[15px] ${
        fullyPresent
          ? "border-admin-attendance-border bg-admin-attendance-bg"
          : "border-admin-absence-border bg-admin-absence-bg"
      }`}
    >
      <span className="flex items-baseline justify-center gap-1 md:justify-between">
        <span
          className={`font-mono text-[13px] md:text-[14px] md:leading-[18px] xl:text-[17px] xl:leading-[22px] ${fullyPresent ? "text-admin-attendance-text" : "text-admin-textMuted"}`}
        >
          {room.number}
        </span>
        <span
          className={`hidden text-[10px] md:block md:leading-[12px] xl:text-xs xl:leading-[14px] ${fullyPresent ? "text-admin-attendance-textMuted" : "text-admin-textFaint"}`}
        >
          {present}/{assigned}명
        </span>
      </span>
      {students.length > 0 && (
        // 4인실이 휴대폰·컴퓨터는 2줄, 카드가 넓고 낮은 패드는 1줄에 들어가도록 열을 나누고 긴 이름은 줄인다. 키가 낮은 휴대폰 가로 화면은 칸이 작아 이름을 숨긴다.
        <span className="grid grid-cols-2 gap-x-1 gap-y-0.5 text-left [@media(max-height:620px)]:hidden md:grid-cols-4 md:[@media(max-height:620px)]:grid xl:grid-cols-2 xl:gap-y-1">
          {students.map((student) => (
            <span
              key={student.studentId}
              className="flex min-w-0 items-center gap-1"
            >
              <span
                aria-hidden
                className={`size-1.5 shrink-0 rounded-full xl:size-2 ${student.present ? "bg-admin-attendance-text" : "bg-admin-absence-text"}`}
              />
              <span
                className={`truncate text-[10px] leading-3 xl:text-xs xl:leading-4 ${student.present ? "text-admin-text" : "text-admin-textFaint"}`}
              >
                {student.name}
                <span className="sr-only">
                  {student.present ? " 출석" : " 미출석"}
                </span>
              </span>
            </span>
          ))}
        </span>
      )}
    </button>
  );
}
