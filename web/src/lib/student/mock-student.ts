export type StudentProfile = {
  name: string;
  /** 화면에 표시하는 학번. DataGSM 필드의 실제 의미·형식은 DEC-002에서 확인 중이다. */
  studentNumber: string;
  floor: number;
  /** 호실 번호(예: "412"). 화면에서 "412호"로 붙여 쓴다. */
  roomNumber: string;
  /** 읽지 않은 알림이 있는지(REQ-COM-005). 노트북 사이드바 알림 강조에 쓴다. */
  hasUnreadNotification: boolean;
  /** 본인 누적 봉사 횟수(REQ-COM-003). 학생은 횟수만 보고 활동별 내역은 없다(DEC-014). */
  volunteerCount: number;
};

/**
 * TODO(REQ-AUTH-005, REQ-COM-005): 실제로는 로그인한 학생 정보와 미확인 알림 여부를 서버에서 받는다.
 * 지금은 화면 개발용 고정 mock이다 — 값은 Figma 사용자-핸드폰/노트북 예시(김도현, 2405, 4층 412호)를 따른다.
 * 읽지 않은 알림은 Figma처럼 강조가 보이도록 있음(true)으로 둔다(사용자 결정).
 */
export const IS_MOCK_STUDENT = true;

export const MOCK_STUDENT: StudentProfile = {
  name: "김도현",
  studentNumber: "2405",
  floor: 4,
  roomNumber: "412",
  hasUnreadNotification: true,
  // 관리자 봉사 mock(mock-volunteers.ts)의 김도현 누적 횟수와 같게 둔다.
  volunteerCount: 5,
};
