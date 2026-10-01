/** 오늘 지정 상태. 없음 → 지정됨 → 완료됨 순으로만 간다(REQ-COM-006). */
export type DutyStatus = "none" | "designated" | "completed";

export type RosterStudent = {
  studentId: string;
  name: string;
  /** 호실 번호. 층은 `floor(roomNumber / 100)`이다(REQ-AUTH-002). */
  roomNumber: number;
  /** 앞으로 해야 할 봉사 횟수(REQ-COM-002). */
  count: number;
  /** 마지막 조정 날짜 `MM/DD`. 아직 없으면 undefined로 `-`를 표시한다. */
  lastActivityDate?: string;
  duty: DutyStatus;
};

/**
 * TODO(REQ-COM-001/002/006): 서버 봉사 API(`/api/v1/volunteer*`, 서버 PR #76)가 배포되면 이 mock을 교체한다.
 * 명단은 서비스에 저장된 전체 학생이다. 지금은 화면 개발용 고정 데이터이며 이름·학번은 4층 일부를 Figma
 * 07 예시에서 옮기고 3·5층은 합성한 값이다. 운영에는 사용하지 않는다.
 */
export const IS_MOCK_VOLUNTEER_ROSTER = true;

export const MOCK_VOLUNTEER_ROSTER: RosterStudent[] = [
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
];
