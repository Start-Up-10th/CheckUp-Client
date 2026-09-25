/** REQ-COM-005가 남기는 알림 유형 3개. 얼굴 재등록 요청·QR 만료 임박은 삭제됐다. */
export type NotificationType = "attendance" | "volunteer" | "notice";

export type StudentNotification = {
  id: string;
  type: NotificationType;
  message: string;
  /** 상대 시각 문구. 실제로는 서버 시각으로 계산한다(명세 예: 오늘 오전 8:12 / 어제 오후 3:40 / 3일 전). */
  timeLabel: string;
};

/**
 * TODO(REQ-COM-005): 실제로는 서버가 본인 알림을 최신순으로 준다. 지금은 화면 개발용 고정 mock이다.
 * Figma 예시 5개 중 삭제된 유형 2개("얼굴 인식 재등록이 필요해요", "QR 코드 유효 시간이 곧
 * 만료돼요")는 빼고 남는 3개 유형만 쓴다. 시각은 명세 예시 문구를 그대로 쓴다.
 * 출석 알림은 당일 출석과 같이 08:00에 폐기되므로(DEC-009) 오늘 것만 둔다.
 */
export const IS_MOCK_NOTIFICATIONS = true;

export const MOCK_NOTIFICATIONS: StudentNotification[] = [
  {
    id: "n1",
    type: "attendance",
    message: "출석이 완료되었습니다",
    timeLabel: "오늘 오전 8:12",
  },
  {
    id: "n2",
    type: "volunteer",
    message: "이번 달 봉사 활동이 등록되었습니다",
    timeLabel: "어제 오후 3:40",
  },
  {
    id: "n3",
    type: "notice",
    message: "기숙사 공지사항이 등록되었습니다",
    timeLabel: "3일 전",
  },
];
