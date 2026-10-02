import type { RosterStudent } from "@/lib/admin/volunteer-types";

/**
 * 로그인 없이 보는 확인용 페이지(`/admin/state-demo/*`)와 화면 테스트가 쓰는 고정 명단이다. 운영 화면은 서버 봉사
 * API(`/api/v1/volunteer`)에서 받으므로 쓰지 않는다. 이름·학번은 4층 일부를 Figma 07 예시에서 옮기고 3·5층은
 * 합성한 값이다.
 */
export const MOCK_VOLUNTEER_ROSTER: RosterStudent[] = (
  [
    {
      studentId: "3101",
      name: "백도윤",
      roomNumber: 301,
      count: 2,
      lastActivityDate: "09/27",
      duty: "none",
    },
    {
      studentId: "3115",
      name: "서지안",
      roomNumber: 301,
      count: 0,
      duty: "none",
    },
    {
      studentId: "3203",
      name: "류하준",
      roomNumber: 302,
      count: 1,
      lastActivityDate: "09/30",
      duty: "none",
    },
    {
      studentId: "2405",
      name: "김도현",
      roomNumber: 412,
      count: 3,
      lastActivityDate: "10/01",
      duty: "designated",
    },
    {
      studentId: "2412",
      name: "박서연",
      roomNumber: 412,
      count: 1,
      lastActivityDate: "09/28",
      duty: "none",
    },
    {
      studentId: "2401",
      name: "정민수",
      roomNumber: 412,
      count: 2,
      lastActivityDate: "10/01",
      duty: "designated",
    },
    {
      studentId: "2408",
      name: "이지후",
      roomNumber: 413,
      count: 0,
      lastActivityDate: "09/24",
      duty: "none",
    },
    {
      studentId: "2417",
      name: "한유진",
      roomNumber: 413,
      count: 2,
      lastActivityDate: "09/30",
      duty: "none",
    },
    {
      studentId: "2409",
      name: "오세훈",
      roomNumber: 413,
      count: 1,
      lastActivityDate: "09/17",
      duty: "none",
    },
    {
      studentId: "2105",
      name: "강민우",
      roomNumber: 414,
      count: 2,
      lastActivityDate: "10/01",
      duty: "none",
    },
    {
      studentId: "2403",
      name: "윤채원",
      roomNumber: 414,
      count: 4,
      lastActivityDate: "09/26",
      duty: "none",
    },
    {
      studentId: "2406",
      name: "강태민",
      roomNumber: 414,
      count: 1,
      lastActivityDate: "09/22",
      duty: "none",
    },
    {
      studentId: "2302",
      name: "최서준",
      roomNumber: 415,
      count: 0,
      lastActivityDate: "09/29",
      duty: "none",
    },
    {
      studentId: "2310",
      name: "문하린",
      roomNumber: 415,
      count: 3,
      lastActivityDate: "09/25",
      duty: "none",
    },
    {
      studentId: "1501",
      name: "임가온",
      roomNumber: 501,
      count: 1,
      lastActivityDate: "09/23",
      duty: "none",
    },
    {
      studentId: "1512",
      name: "남예린",
      roomNumber: 501,
      count: 0,
      duty: "none",
    },
  ] as Omit<RosterStudent, "id">[]
).map((student, index) => ({ id: index + 1, ...student }));
