"use client";

import { useState } from "react";
import { AttendanceSegmentedToggle } from "@/components/admin/AttendanceSegmentedToggle";
import {
  roomAttendance,
  sortedRoomStudents,
  type Room,
  type Student,
} from "@/lib/admin/mock-floor-data";

type RoomAttendanceEditDialogProps = {
  room: Room;
  onClose: () => void;
  onSave: (roomNumber: string, students: Student[]) => void;
};

/**
 * REQ-ATT-006: 출석/미출석을 선택하고 저장해야만 반영된다. 저장 전 닫기는 변경하지 않는다.
 * Figma node 572:150 "호실 출석 변경 다이얼로그".
 */
export function RoomAttendanceEditDialog({
  room,
  onClose,
  onSave,
}: RoomAttendanceEditDialogProps) {
  const [pendingStudents, setPendingStudents] = useState<Student[]>(
    room.students,
  );
  const { assigned, present } = roomAttendance({
    ...room,
    students: pendingStudents,
  });

  function setStudentPresent(studentId: string, nextPresent: boolean) {
    setPendingStudents((students) =>
      students.map((student) =>
        student.studentId === studentId
          ? { ...student, present: nextPresent }
          : student,
      ),
    );
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#1c1c1e]/45"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`room-edit-dialog-title-${room.number}`}
        className="z-50 flex w-[310px] max-w-[calc(100vw-32px)] flex-col gap-1 rounded-[16px] bg-admin-surface p-4 md:w-[400px] md:p-[22px] xl:w-[460px]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id={`room-edit-dialog-title-${room.number}`}
          className="text-[17px] font-bold leading-5 text-admin-text md:text-xl md:leading-[24px]"
        >
          {room.number}호
        </h2>
        <p className="text-[13px] leading-4 text-admin-textMuted md:text-sm md:leading-[17px]">
          {assigned}인실 · {present}명 출석
        </p>

        <div className="flex w-full flex-col gap-1.5 pt-3">
          {sortedRoomStudents({ ...room, students: pendingStudents }).map(
            (student, index) => (
              <div
                key={student.studentId}
                className="flex w-full items-center justify-between rounded-xl bg-admin-rowSurface py-2.5 pl-3.5 pr-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[12px] text-admin-textFaint md:text-[13px]">
                    {index + 1}번
                  </span>
                  <span className="text-[13px] font-bold leading-4 text-admin-text md:text-sm md:leading-5">
                    {student.name}
                  </span>
                </div>
                <AttendanceSegmentedToggle
                  present={student.present}
                  onChange={(nextPresent) =>
                    setStudentPresent(student.studentId, nextPresent)
                  }
                />
              </div>
            ),
          )}
        </div>

        <div className="flex h-[100px] w-full items-start justify-end gap-2 pt-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[13px] bg-admin-ghost-bg px-[18px] py-[11px] text-[13px] font-bold leading-4 text-admin-ghost-text md:px-[22px] md:py-[13px] md:text-sm md:leading-5"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={() => onSave(room.number, pendingStudents)}
            className="rounded-[13px] bg-admin-accent-bg px-[18px] py-[11px] text-[13px] font-bold leading-4 text-admin-accent-text md:px-[22px] md:py-[13px] md:text-sm md:leading-5"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
