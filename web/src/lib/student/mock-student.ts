/**
 * TODO: 학생 화면에서 아직 서버 값이 없는 것만 남긴 화면 개발용 고정 mock이다.
 * 이름·학번·층·호실은 서버 본인 정보(`/api/v1/auth/me`, current-student.ts)로, 읽지 않은 알림 여부는
 * 서버(unread-notification.ts)로 바뀌었다.
 */
export const IS_MOCK_STUDENT = true;

export const MOCK_STUDENT = {
  /**
   * 본인 누적 봉사 횟수(REQ-COM-003). 서버 `volunteerCount`는 "앞으로 해야 할 횟수"(하네스 DEC-020)라 화면의
   * `누적 봉사 횟수`와 의미를 맞춘 뒤 연결한다(CheckUp-server#87). 활동 내역 mock(mock-volunteer.ts)의 합계와 같다.
   */
  volunteerCount: 5,
  /** 얼굴 등록을 마쳤는지. 미등록이면 학생 홈 대신 얼굴 등록으로 보낸다(REQ-UI-003). */
  faceRegistered: true,
};
