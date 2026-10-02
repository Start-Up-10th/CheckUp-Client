export type StudentProfile = {
  name: string;
  /** 화면에 표시하는 학번. DataGSM 필드의 실제 의미·형식은 DEC-002에서 확인 중이다. */
  studentNumber: string;
  floor: number;
  /** 호실 번호(예: "412"). 화면에서 "412호"로 붙여 쓴다. */
  roomNumber: string;
  /** 본인 누적 봉사 횟수(REQ-COM-003). 학생은 횟수만 보고 활동별 내역은 없다(DEC-014). */
  volunteerCount: number;
  /** 얼굴 등록을 마쳤는지. 미등록이면 학생 홈 대신 얼굴 등록으로 보낸다(REQ-UI-003). */
  faceRegistered: boolean;
};

/**
 * TODO(REQ-AUTH-005): 실제로는 로그인한 학생 정보를 서버에서 받는다.
 * 지금은 화면 개발용 고정 mock이다 — 값은 Figma 사용자-핸드폰/노트북 예시(김도현, 2405, 4층 412호)를 따른다.
 * 읽지 않은 알림 여부는 서버에서 받는다(unread-notification.ts).
 */
export const IS_MOCK_STUDENT = true;

export const MOCK_STUDENT: StudentProfile = {
  name: "김도현",
  studentNumber: "2405",
  floor: 4,
  roomNumber: "412",
  // 활동 내역 mock(mock-volunteer.ts)의 합계와 같게 둔다. 관리자 봉사 명단 mock과는 값이 연결돼 있지 않다.
  volunteerCount: 5,
  faceRegistered: true,
};
