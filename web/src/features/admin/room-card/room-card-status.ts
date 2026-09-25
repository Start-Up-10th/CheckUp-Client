import { roomAttendance, type Room } from "@/lib/admin/mock-floor-data";

/** REQ-UI-001: 공실은 없다는 전제라 전원 출석 / 일부 미출석 두 상태만 둔다. */
export type RoomCardStatus = "present" | "absent";

export function roomCardStatus(room: Room): RoomCardStatus {
  const { assigned, present } = roomAttendance(room);
  return present === assigned ? "present" : "absent";
}

/** REQ-UI-001: 분모는 4명 고정이 아니라 해당 호실 배정 인원이다. */
export function roomCardCountLabel(room: Room): string {
  const { assigned, present } = roomAttendance(room);
  return `${present}/${assigned}명`;
}
