/** 오늘 지정 상태. 없음 → 지정됨 → 완료됨 순으로만 간다(REQ-COM-006). */
/** 오늘 지정 상태. 없음 → 지정됨 → 완료됨 또는 미이행으로만 간다(REQ-COM-006). */
export type DutyStatus = "none" | "designated" | "completed" | "missed";

export type RosterStudent = {
  /** 서버 봉사 API 경로에 쓰는 학생 ID(`studentId`). 화면에 보이는 학번과 다르다. */
  id: number;
  /** 학번. 화면 표시와 검색에 쓴다. */
  studentId: string;
  name: string;
  /** 호실 번호. 층은 `floor(roomNumber / 100)`이다(REQ-AUTH-002). 호실이 배정되지 않았으면 null이다. */
  roomNumber: number | null;
  /** 앞으로 해야 할 봉사 횟수(REQ-COM-002). */
  count: number;
  /** 마지막 조정 날짜 `MM/DD`. 아직 없으면 undefined로 `-`를 표시한다. */
  lastActivityDate?: string;
  duty: DutyStatus;
};

/** 지난 날짜 당일 봉사자 기록의 결과. 미이행은 봉사 없이 사라져 횟수가 추가된 지정이다(#334). */
export type DutyRecordStatus = "assigned" | "completed" | "missed";

/** 한 운영일의 당일 봉사자 기록 한 건. `studentId`는 학번이다. */
export type DutyRecord = {
  /** 서버 봉사 API 경로에 쓰는 학생 ID(`RosterStudent.id`와 같다). */
  id: number;
  studentId: string;
  name: string;
  roomNumber: number | null;
  status: DutyRecordStatus;
  /** 미이행 학생에게 봉사 횟수를 추가해 처리했는지. 아니면 아직 횟수가 처리되지 않은 미이행이다. */
  adjusted?: boolean;
  /** 처리하며 추가한 횟수(음수는 차감). 횟수를 처리하지 않았으면 비어 있다. */
  addedCount?: number;
  /** 처리하며 남긴 사유. 없으면 비어 있다. */
  reason?: string;
};
