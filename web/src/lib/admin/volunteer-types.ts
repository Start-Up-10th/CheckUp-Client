/** 오늘 지정 상태. 없음 → 지정됨 → 완료됨 순으로만 간다(REQ-COM-006). */
export type DutyStatus = "none" | "designated" | "completed";

export type RosterStudent = {
  /** 서버 봉사 API 경로에 쓰는 학생 ID(`studentId`). 화면에 보이는 학번과 다르다. */
  id: number;
  /** 학번. 화면 표시와 검색에 쓴다. */
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
