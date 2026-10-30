import {
  roomAttendance,
  sortedRoomStudents,
  type Room,
} from "@/lib/admin/floor-types";

type RoomCardProps = {
  room: Room;
  onClick?: (room: Room) => void;
};

/**
 * REQ-UI-001: 전원 출석은 라임 계열, 일부 미출석과 등록한 학생이 없는 호실(0/0)은 회색 계열로 구분한다.
 * 모든 기기에서 왼쪽 위부터 채운다. 폰은 호실 번호만, 패드·컴퓨터는 호실 번호와 출석 인원을 한 줄에 보여준다.
 * 그 아래에 학생 이름을 이름순으로 보인다. 출석은 채운 연두 점과 차분한 중립 글자, 미출석은 빈 회색 고리와 흐린 글자라
 * 색을 구별하기 어려워도 점 모양으로 알 수 있다. 이름 열은 이름 길이에 맞추고 열 사이 간격을 고정한다(DEC-114).
 */
export function RoomCard({ room, onClick }: RoomCardProps) {
  const { assigned, present } = roomAttendance(room);
  // 등록한 학생이 없는 호실(0/0)은 전원 출석이 아니라 회색이다(DEC-059).
  const fullyPresent = assigned > 0 && present >= assigned;

  // 호실 상세와 같은 이름순이라, 출석이 바뀌어도 이름 자리가 움직이지 않는다(REQ-UI-002).
  const students = sortedRoomStudents(room.students ?? []);

  return (
    <button
      type="button"
      onClick={onClick ? () => onClick(room) : undefined}
      disabled={!onClick}
      className={`flex min-w-0 flex-col items-stretch justify-start gap-1 overflow-hidden rounded-[10px] border px-1.5 py-1.5 text-left [@media(max-height:620px)]:py-1 md:[@media(max-height:620px)]:py-[11px] transition hover:brightness-95 md:gap-1 md:rounded-[12px] md:p-[11px] xl:aspect-auto xl:h-full xl:gap-2 xl:[@media(min-height:900px)]:gap-3 xl:rounded-card xl:p-[15px] ${
        fullyPresent
          ? "border-admin-attendance-border bg-admin-attendance-bg"
          : "border-admin-absence-border bg-admin-absence-bg"
      }`}
    >
      <span className="flex items-baseline justify-between gap-1">
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
        // 모든 기기에서 2열이라 4인실은 2줄이다. 긴 이름은 줄인다. 높이 620px 이하 화면(휴대폰 가로 등)은 칸이 작아 기기와 상관없이 이름을 숨긴다.
        <span className="grid grid-cols-[repeat(2,minmax(0,max-content))] gap-x-2 gap-y-0.5 text-left [@media(max-height:620px)]:hidden xl:gap-x-5 xl:gap-y-1 xl:[@media(min-height:900px)_and_(max-height:999.98px)]:gap-y-2 xl:[@media(min-height:1000px)]:gap-y-3">
          {students.map((student) => (
            <span
              key={student.studentId}
              className="flex min-w-0 items-center gap-1 xl:[@media(min-height:900px)]:gap-2"
            >
              <span
                aria-hidden
                className={`size-[5px] shrink-0 rounded-full xl:size-1.5 xl:[@media(min-height:900px)_and_(max-height:999.98px)]:size-[7px] xl:[@media(min-height:1000px)]:size-2 ${student.present ? "bg-admin-attendance-textMuted" : "border border-admin-absence-text"}`}
              />
              <span
                className={`truncate text-[10px] leading-3 xl:text-xs xl:leading-4 xl:[@media(min-height:900px)_and_(max-height:999.98px)]:text-sm xl:[@media(min-height:900px)_and_(max-height:999.98px)]:leading-5 xl:[@media(min-height:1000px)]:text-[15px] xl:[@media(min-height:1000px)]:leading-[22px] ${student.present ? "text-admin-text/75" : "text-admin-textFaint"}`}
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
