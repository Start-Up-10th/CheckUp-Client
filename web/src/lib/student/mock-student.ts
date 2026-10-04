/**
 * TODO: 학생 화면에서 아직 서버 값이 없는 것만 남긴 화면 개발용 고정 mock이다.
 * 이름·학번·층·호실은 서버 본인 정보(`/api/v1/auth/me`, current-student.ts)로, 읽지 않은 알림 여부는
 * 서버(unread-notification.ts)로, 봉사 횟수·내역은 서버(volunteer-api.ts)로 바뀌었다.
 */
export const IS_MOCK_STUDENT = true;

export const MOCK_STUDENT = {
  /** 얼굴 등록을 마쳤는지. 미등록이면 학생 홈 대신 얼굴 등록으로 보낸다(REQ-UI-003). 얼굴 등록 연동은 철회돼 mock이다. */
  faceRegistered: true,
};
