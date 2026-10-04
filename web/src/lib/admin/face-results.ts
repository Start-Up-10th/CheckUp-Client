import type { FaceResult } from "@/lib/admin/face-api";

export type RecognitionOutcome = "success" | "failure";

export type RecognitionEntry = {
  id: string;
  /** 실패는 신원을 붙이지 않는다(REQ-FACE-005/007) — "인식 실패"만 표시. */
  label: string;
  outcome: RecognitionOutcome;
  recognizedAt: string;
};

/** 카메라 화면에 잠깐 보이는 성공 문구(REQ-FACE-007 `성공 · 학번 이름`). */
export function successMessage(entry: RecognitionEntry): string {
  return `성공 · ${entry.label}`;
}

/** 같은 학생의 성공을 목록에 다시 올리지 않는 시간. 지나가는 동안 매 프레임 성공이 쌓이지 않게 한다. */
export const SUCCESS_DEDUPE_MS = 10_000;
/** 화면에서 사라진 얼굴 트랙의 시도 횟수를 기억하는 시간. 잠깐 놓쳤다 돌아와도 실패를 다시 세지 않는다. */
export const TRACK_MEMORY_MS = 30_000;
/** 최근 인식 목록에 남기는 최대 개수(당일 임시 기록, REQ-FACE-007). */
export const MAX_ENTRIES = 30;

export type StudentLabel = { studentNumber: number; name: string };

export type RecognitionState = {
  /** 최신순. */
  entries: RecognitionEntry[];
  /** 트랙별로 마지막으로 본 시도 횟수와 시각. 같은 시도를 프레임마다 실패로 세지 않기 위해 둔다. */
  tracks: Record<string, { attempts: number; seenAt: number }>;
  /** 학번별 마지막 성공 시각. */
  successAt: Record<number, number>;
  /** 새 항목 id를 만드는 번호. */
  sequence: number;
};

export const INITIAL_RECOGNITION: RecognitionState = {
  entries: [],
  tracks: {},
  successAt: {},
  sequence: 0,
};

export type FrameOutcome = {
  state: RecognitionState;
  /** 이번 프레임에서 새로 생긴 성공(화면 중앙의 `성공 · 학번 이름`). 없으면 null. */
  success: RecognitionEntry | null;
  /** 이번 프레임에서 새 실패 행이 생겼는가(카메라 하단의 `인식 실패` 표시). */
  failure: boolean;
  /** 이번 프레임의 얼굴 중 서버가 QR 출석을 안내하라고 한 얼굴이 있는가(REQ-FACE-006). */
  qrRecommended: boolean;
};

const TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Seoul",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function timeLabel(now: Date): string {
  return TIME.format(now);
}

/**
 * 프레임 한 장의 인식 결과를 최근 인식 목록에 반영한다(REQ-FACE-005~007). 순수 함수다.
 * - KNOWN(출석 기록됨·이미 출석)은 성공 행이다. 같은 학생은 10초 안에 다시 올리지 않는다. 서버가 거절한
 *   출석(STALE·REJECTED)은 성공으로 세지 않는다.
 * - UNKNOWN은 신원 없는 `인식 실패` 행이다. 트랙의 시도 횟수(attempts)가 늘었을 때만 올리고, 서버가 센 시도
 *   단위를 쓴다(매 프레임을 실패 1회로 세지 않는다).
 * - NOT_ATTEMPTED는 아직 시도하지 않은 얼굴이라 아무 것도 하지 않는다.
 * 얼굴마다 따로 처리해 서로의 이름·실패 횟수를 섞지 않는다.
 */
export function applyFrame(
  prev: RecognitionState,
  faces: FaceResult[],
  now: Date,
): FrameOutcome {
  const nowMs = now.getTime();
  const tracks: RecognitionState["tracks"] = {};
  for (const [id, track] of Object.entries(prev.tracks)) {
    if (nowMs - track.seenAt <= TRACK_MEMORY_MS) tracks[id] = track;
  }
  const successAt = { ...prev.successAt };
  const added: RecognitionEntry[] = [];
  let sequence = prev.sequence;
  let success: RecognitionEntry | null = null;
  let qrRecommended = false;
  let failure = false;

  for (const face of faces) {
    const seenAttempts = tracks[face.trackId]?.attempts ?? 0;
    tracks[face.trackId] = {
      attempts: Math.max(seenAttempts, face.attempts),
      seenAt: nowMs,
    };
    if (face.qrRecommended && face.status === "UNKNOWN") qrRecommended = true;

    if (
      face.status === "KNOWN" &&
      face.studentNumber !== undefined &&
      face.studentName !== undefined
    ) {
      const counted =
        face.attendance === "RECORDED" || face.attendance === "DUPLICATE";
      const last = successAt[face.studentNumber];
      if (!counted || (last !== undefined && nowMs - last < SUCCESS_DEDUPE_MS))
        continue;
      successAt[face.studentNumber] = nowMs;
      sequence += 1;
      const entry: RecognitionEntry = {
        id: String(sequence),
        label: `${face.studentNumber} ${face.studentName}`,
        outcome: "success",
        recognizedAt: timeLabel(now),
      };
      added.push(entry);
      success = entry;
    } else if (face.status === "UNKNOWN" && face.attempts > seenAttempts) {
      sequence += 1;
      failure = true;
      added.push({
        id: String(sequence),
        label: "인식 실패",
        outcome: "failure",
        recognizedAt: timeLabel(now),
      });
    }
  }

  return {
    state: {
      entries: [...added.reverse(), ...prev.entries].slice(0, MAX_ENTRIES),
      tracks,
      successAt,
      sequence,
    },
    success,
    failure,
    qrRecommended,
  };
}
