export type Volunteer = {
  studentId: string;
  name: string;
  room: string;
  /** 누적 봉사 횟수. 명단에서 제외돼도 유지된다(REQ-COM-001, DEC-010). */
  count: number;
  /** 현재 봉사자 명단 소속 여부. count와 독립적이다. */
  isMember: boolean;
};

/**
 * TODO(REQ-COM-001/002): 실제로는 서버가 전체 학생 목록과 명단 소속·누적 횟수를 관리한다.
 * 지금은 화면 개발용 고정 mock이며, 두 화면(관리/추가)이 같은 목록을 각자 로컬 state로
 * 들고 있어 실제로는 페이지를 이동하면 초기화된다 — 다른 관리자 화면들과 동일한 수준.
 * 최유진·신동욱은 count>0인데 isMember=false인 예시로, 재추가 시 누적이 유지되는지 보여준다.
 */
export const IS_MOCK_VOLUNTEERS = true;

export const MOCK_VOLUNTEERS: Volunteer[] = [
  {
    studentId: "2405",
    name: "김도현",
    room: "412호",
    count: 5,
    isMember: true,
  },
  {
    studentId: "2412",
    name: "박서연",
    room: "412호",
    count: 3,
    isMember: true,
  },
  {
    studentId: "2408",
    name: "이지후",
    room: "412호",
    count: 2,
    isMember: true,
  },
  {
    studentId: "2401",
    name: "정민수",
    room: "412호",
    count: 1,
    isMember: true,
  },
  {
    studentId: "2417",
    name: "한유진",
    room: "415호",
    count: 6,
    isMember: true,
  },
  {
    studentId: "2409",
    name: "오세훈",
    room: "415호",
    count: 0,
    isMember: true,
  },
  {
    studentId: "2403",
    name: "윤채원",
    room: "407호",
    count: 4,
    isMember: true,
  },
  {
    studentId: "2406",
    name: "강태민",
    room: "407호",
    count: 2,
    isMember: true,
  },
  {
    studentId: "2414",
    name: "최유진",
    room: "408호",
    count: 3,
    isMember: false,
  },
  {
    studentId: "2420",
    name: "신동욱",
    room: "409호",
    count: 0,
    isMember: false,
  },
];
