export type RecognitionOutcome = "success" | "failure";

export type RecognitionEntry = {
  id: string;
  /** 실패는 신원을 붙이지 않는다(REQ-FACE-005/007) — "인식 실패"만 표시. */
  label: string;
  outcome: RecognitionOutcome;
  recognizedAt: string;
};

/**
 * TODO(REQ-FACE-005~007): 실제 얼굴 인식 결과는 AI(FastAPI)·Spring 연동이 있어야 나온다.
 * 지금은 "최근 인식" 목록 UI를 보여주기 위한 고정 예시이며 실제 카메라 인식과 무관하다.
 * Figma 예시 데이터는 실패 행에도 이름을 붙였지만(2408 이지후), REQ-FACE-007이
 * "실패는 신원 없는 인식 실패로 표현한다"고 명시하므로 이름을 붙이지 않는다.
 */
export const IS_MOCK_RECOGNITIONS = true;

/** 목록 앞(최신)부터 연속 실패 횟수를 센다. REQ-FACE-007: 3회 이상이면 QR 안내 배너를 표시한다. */
export function countLeadingFailures(entries: RecognitionEntry[]): number {
  let count = 0;
  for (const entry of entries) {
    if (entry.outcome === "failure") count++;
    else break;
  }
  return count;
}

export const MOCK_RECENT_RECOGNITIONS: RecognitionEntry[] = [
  { id: "1", label: "2405 김도현", outcome: "success", recognizedAt: "22:04" },
  { id: "2", label: "2412 박서연", outcome: "success", recognizedAt: "22:03" },
  { id: "3", label: "인식 실패", outcome: "failure", recognizedAt: "22:03" },
  { id: "4", label: "2401 정민수", outcome: "success", recognizedAt: "22:02" },
  { id: "5", label: "2417 한유진", outcome: "success", recognizedAt: "22:01" },
];
