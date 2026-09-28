import type { RoomMate } from "@/components/student/RoomMap";

/**
 * TODO(REQ-UI-003, DEC-002): 실제로는 서버가 로그인한 학생 본인 호실의 배정 학생과 오늘 출석 여부를 준다
 * (다른 호실·다른 층은 주지 않는다). 지금은 화면 개발용 고정 mock이다 — Figma 04·메인 예시와 같이
 * 412호 4명 중 정민수만 미출석이다. 배정 인원이 곧 `N인실`의 N이다(고정 정원 아님).
 */
export const IS_MOCK_ROOM = true;

const MOCK_ROOM_MATES: RoomMate[] = [
  { id: "2412", name: "박서연", present: true },
  { id: "2421", name: "정민수", present: false },
  { id: "2405", name: "김도현", present: true },
  { id: "2418", name: "이지후", present: true },
];

/** 이름순(같으면 학번순) — 관리자 호실 상세(sortedRoomStudents)와 같은 기준이라 번호가 서로 맞는다. */
export function sortRoomMates(mates: RoomMate[]): RoomMate[] {
  return [...mates].sort(
    (a, b) => a.name.localeCompare(b.name, "ko") || a.id.localeCompare(b.id),
  );
}

export const MOCK_MY_ROOM = sortRoomMates(MOCK_ROOM_MATES);
