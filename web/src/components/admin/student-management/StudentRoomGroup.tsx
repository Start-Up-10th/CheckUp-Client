import { StudentRow } from "@/components/admin/student-management/StudentRow";
import type { RoomGroup } from "@/lib/admin/volunteer-roster";

type StudentRoomGroupProps = {
  group: RoomGroup;
  onSelect: (studentId: string) => void;
};

/**
 * Figma 08 학생 관리의 호실 묶음. `412호 3명` 머리글 아래 학생 줄이 8px 간격으로 이어진다. 머리글은 핸드폰 13/10,
 * 패드 14/11, 컴퓨터 15/12 글자다.
 */
export function StudentRoomGroup({ group, onSelect }: StudentRoomGroupProps) {
  return (
    <section
      aria-label={`${group.roomNumber}호`}
      className="flex flex-col gap-2"
    >
      <div className="flex items-center gap-1.5 pl-0.5 xl:gap-2 xl:pl-1">
        <h2 className="text-[13px] font-bold leading-4 text-admin-text md:text-sm md:leading-[17px] xl:text-[15px] xl:leading-[18px]">
          {group.roomNumber}호
        </h2>
        <p className="font-mono text-[10px] leading-3 text-admin-textMuted md:text-[11px] md:leading-[13px] xl:text-xs xl:leading-[14px]">
          {group.students.length}명
        </p>
      </div>
      {group.students.map((student) => (
        <StudentRow
          key={student.studentId}
          student={student}
          onSelect={onSelect}
        />
      ))}
    </section>
  );
}
