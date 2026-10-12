import { RoomSeatCard } from "./RoomSeatCard";

export type RoomMate = { id: string; name: string; present: boolean };

/**
 * 학생 홈 호실 배치 그림(Figma 핸드폰 5:34, 노트북 224:63; REQ-UI-003, 사용자 결정 2026-09-25).
 * 학생 카드를 2열로 놓는다. Figma의 `창문`·`출입문` 표시는 그리지 않는다(사용자 결정 2026-10-11, DEC-068).
 * `students`는 이름순으로 넘겨받고 순서대로 1번부터 번호를 붙인다(침대 번호 아님).
 * 카드 수는 배정 인원 그대로이며, 홀수일 때 마지막 줄 오른쪽은 보이지 않는 칸으로 비워 2열을 유지한다
 * (빈 침대 카드를 그리지 않는다).
 */
export function RoomMap({ students }: { students: RoomMate[] }) {
  const rows: RoomMate[][] = [];
  for (let i = 0; i < students.length; i += 2) {
    rows.push(students.slice(i, i + 2));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-card border border-admin-border bg-[#fafafb] dark:bg-admin-rowSurface p-2.5 md:rounded-2xl md:p-4">
      <ul className="flex min-h-0 flex-1 flex-col gap-2 md:gap-2.5">
        {rows.map((row, rowIndex) => (
          <li key={rowIndex} className="flex min-h-0 flex-1 gap-2 md:gap-2.5">
            {row.map((student, i) => (
              <RoomSeatCard
                key={student.id}
                name={student.name}
                order={rowIndex * 2 + i + 1}
                present={student.present}
              />
            ))}
            {row.length === 1 && (
              <div aria-hidden="true" className="min-w-0 flex-1" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
