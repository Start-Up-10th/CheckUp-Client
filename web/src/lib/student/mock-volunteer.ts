export type VolunteerRecord = {
  id: string;
  /** 관리자가 적립할 때 남긴 활동명(REQ-COM-002) */
  activityName: string;
  /** 날짜(요일) 문구. 실제로는 서버 날짜로 계산한다(Figma 예: 9월 12일 (금)). */
  dateLabel: string;
  /** 이 기록으로 적립된 횟수 */
  count: number;
};

/**
 * TODO(REQ-COM-003): 실제로는 서버가 로그인한 학생 본인의 봉사 활동 내역을 최신순으로 준다
 * (다른 학생 것은 주지 않는다). 지금은 화면 개발용 고정 mock이다 — Figma 07 · 봉사 활동
 * (319:295~315) 예시 5개를 그대로 쓰며, 합계가 MOCK_STUDENT.volunteerCount(5회)와 같다.
 */
export const IS_MOCK_VOLUNTEER_HISTORY = true;

export const MOCK_VOLUNTEER_HISTORY: VolunteerRecord[] = [
  {
    id: "v1",
    activityName: "도서관 정리",
    dateLabel: "9월 12일 (금)",
    count: 1,
  },
  {
    id: "v2",
    activityName: "급식실 봉사",
    dateLabel: "9월 3일 (수)",
    count: 1,
  },
  { id: "v3", activityName: "교내 청소", dateLabel: "8월 27일 (목)", count: 1 },
  {
    id: "v4",
    activityName: "도서관 정리",
    dateLabel: "8월 20일 (목)",
    count: 1,
  },
  {
    id: "v5",
    activityName: "급식실 봉사",
    dateLabel: "8월 12일 (수)",
    count: 1,
  },
];
