import type { Floor, Room } from "@/lib/admin/floor-types";

/**
 * 층별 호실 번호 목록(Figma 관리자-컴퓨터 02 · 메인 전개도 기준: 3층 301~320, 4층 401~421, 5층 501~518).
 * 서버 층 현황(`GET /api/v1/room/floor`)은 등록한 학생이 있는 호실만 주므로, 학생이 아직 등록하지 않은 호실도
 * 전개도에 항상 보이게 하려고 웹이 목록을 가진다(DEC-059). 실제 기숙사 호실이 바뀌면 여기를 고친다.
 */
const FLOOR_RANGES: Record<Floor, { first: number; last: number }> = {
  3: { first: 301, last: 320 },
  4: { first: 401, last: 421 },
  5: { first: 501, last: 518 },
};

export function floorRoomNumbers(floor: Floor): string[] {
  const { first, last } = FLOOR_RANGES[floor];
  return Array.from({ length: last - first + 1 }, (_, i) => String(first + i));
}

/**
 * 서버가 준 호실에 이 층의 모든 호실을 합친다. 서버가 주지 않은 호실(등록한 학생이 없음)은 배정 0명·출석 0명이고,
 * 학생이 등록하고 출석하면 서버가 그 호실 값을 올려 준다. 목록에 없는 호실을 서버가 주면 버리지 않고 함께 둔다.
 * 호실 번호 오름차순이다.
 */
export function withAllRooms(floor: Floor, rooms: Room[]): Room[] {
  const byNumber = new Map(rooms.map((room) => [room.number, room]));
  for (const number of floorRoomNumbers(floor)) {
    if (!byNumber.has(number)) {
      byNumber.set(number, { number, assigned: 0, present: 0 });
    }
  }
  return [...byNumber.values()].sort(
    (a, b) => Number(a.number) - Number(b.number),
  );
}
