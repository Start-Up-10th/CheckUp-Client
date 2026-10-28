import type { FaceResult } from "@/lib/admin/face-api";

/** 최근 인식 목록에 남기는 최대 개수(사용자 결정, DEC-107). 넘으면 가장 오래된 항목부터 지운다. */
export const MAX_RECENT = 30;

/** 최근 인식 목록의 한 줄. `label`(`학번 이름`)은 실패에는 없다(REQ-FACE-005). */
export type RecentEntry = {
  id: string;
  kind: "success" | "alreadyDone" | "failure";
  label?: string;
  /** 인식한 시각 `HH:mm`. */
  time: string;
  /** 인식한 날짜(`YYYY-MM-DD`). 하루가 지나면 지난 날의 줄을 지우는 데 쓴다. */
  day: string;
};

/** 이번 프레임 결과의 목록 줄. id를 만들어 순수하지 않으니 상태 갱신 함수 밖에서 부른다. 프레임 안에서는 성공, 이미 처리됨, 실패 순이다. */
export function newEntries(
  outcome: Pick<FrameOutcome, "success" | "alreadyDone" | "failure">,
  at: Date,
): RecentEntry[] {
  const time = `${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}`;
  const day = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(at.getDate()).padStart(2, "0")}`;
  const entry = (kind: RecentEntry["kind"], label?: string): RecentEntry => ({
    id: crypto.randomUUID(),
    kind,
    label,
    time,
    day,
  });
  return [
    ...outcome.success.map((label) => entry("success", label)),
    ...outcome.alreadyDone.map((label) => entry("alreadyDone", label)),
    ...Array.from({ length: outcome.failure }, () => entry("failure")),
  ];
}

/** 새 줄을 목록 맨 위에 더한다(최근 것이 위). 날짜가 바뀌면 지난 날의 줄은 지우고, 최대 개수를 넘으면 가장 오래된 것부터 지운다. */
export function addRecent(
  prev: RecentEntry[],
  added: RecentEntry[],
): RecentEntry[] {
  if (added.length === 0) return prev;
  const today = prev.filter((entry) => entry.day === added[0].day);
  return [...added, ...today].slice(0, MAX_RECENT);
}

/** 화면에서 사라진 얼굴 트랙의 시도 횟수를 기억하는 시간. 잠깐 놓쳤다 돌아와도 실패를 다시 세지 않는다. */
export const TRACK_MEMORY_MS = 30_000;
/** 한 얼굴이 이만큼 실패하면 QR 출석 안내를 보인다. */
export const QR_NOTICE_ATTEMPTS = 3;

export type RecognitionState = {
  /**
   * 트랙별로 마지막으로 본 시도 횟수와 시각. 같은 시도를 프레임마다 실패로 세지 않기 위해 둔다.
   * `done`은 그 트랙에서 이미 성공(`RECORDED`)이나 이미 처리됨(`DUPLICATE`) 안내를 보였는지다. 같은 얼굴이 계속 서 있는 동안
   * 프레임마다 안내를 되풀이하거나, 방금 성공했는데 곧바로 `이미 처리됐어요`로 바뀌지 않게 한다.
   */
  tracks: Record<string, { attempts: number; seenAt: number; done?: boolean }>;
};

export const INITIAL_RECOGNITION: RecognitionState = {
  tracks: {},
};

export type FrameOutcome = {
  state: RecognitionState;
  /** 이번 프레임에서 성공한 얼굴마다의 `학번 이름`(화면의 `성공 · 학번 이름`). 없으면 빈 목록. */
  success: string[];
  /** 이번 프레임에서 이미 출석 처리돼 있던 학생을 다시 인식한 얼굴마다의 `학번 이름`. 없으면 빈 목록(DEC-073). */
  alreadyDone: string[];
  /** 이번 프레임에서 새로 생긴 실패 얼굴 수(최근 인식 목록의 `인식 실패`). */
  failure: number;
  /** 이번 프레임의 얼굴 중 QR 출석을 안내해야 하는 얼굴이 있는가(REQ-FACE-006). */
  qrRecommended: boolean;
};

/**
 * 프레임 한 장의 인식 결과를 성공·실패·QR 안내로 가른다(REQ-FACE-005~007). 순수 함수다.
 * - KNOWN이고 출석이 이번에 기록됐으면(RECORDED) 성공이다. 이미 출석해 있던 학생(DUPLICATE)은 성공이 아니라 `이미 처리됐어요`로
 *   알린다. 같은 트랙에서 한 번 알렸으면(성공이든 이미 처리됨이든) 다시 알리지 않는다. 서버가 거절한 출석(STALE·REJECTED)은
 *   아무 것도 하지 않는다.
 * - UNKNOWN은 신원 없는 `인식 실패`다. 트랙의 시도 횟수(attempts)가 늘었을 때만 실패로 알리고, 서버가 센 시도
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
  const success: string[] = [];
  const alreadyDone: string[] = [];
  let qrRecommended = false;
  let failure = 0;

  for (const face of faces) {
    const seenAttempts = tracks[face.trackId]?.attempts ?? 0;
    const done = tracks[face.trackId]?.done === true;
    tracks[face.trackId] = {
      attempts: Math.max(seenAttempts, face.attempts),
      seenAt: nowMs,
      ...(done ? { done: true } : {}),
    };
    // 서버 권고가 없어도 같은 얼굴이 3회 실패하면 QR 안내를 보인다(사용자 결정 2026-10-06, DEC-004 수정).
    if (
      face.status === "UNKNOWN" &&
      (face.qrRecommended || face.attempts >= QR_NOTICE_ATTEMPTS)
    ) {
      qrRecommended = true;
    }

    if (
      face.status === "KNOWN" &&
      face.studentNumber !== undefined &&
      face.studentName !== undefined
    ) {
      const label = `${face.studentNumber} ${face.studentName}`;
      if (face.attendance === "RECORDED") {
        // 같은 트랙의 이어지는 프레임이 곧바로 `이미 처리됨`으로 바뀌지 않게 이 트랙을 처리된 것으로 표시한다.
        if (!done) success.push(label);
        tracks[face.trackId].done = true;
      } else if (face.attendance === "DUPLICATE") {
        if (!done) alreadyDone.push(label);
        tracks[face.trackId].done = true;
      }
    } else if (face.status === "UNKNOWN" && face.attempts > seenAttempts) {
      failure += 1;
    }
  }

  return {
    state: { tracks },
    success,
    alreadyDone,
    failure,
    qrRecommended,
  };
}
