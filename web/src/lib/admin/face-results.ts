import type { FaceResult } from "@/lib/admin/face-api";

/** 당일 기록을 폐기하는 시각(시). 최근 인식 목록은 이 시각을 하루의 경계로 삼는다(DEC-108). */
export const DAY_RESET_HOUR = 8;

/** `at`이 속한 운영일(`YYYY-MM-DD`). 08:00에 바뀌므로 그 전의 새벽은 전날로 센다. */
function operatingDay(at: Date): string {
  const shifted = new Date(at.getTime() - DAY_RESET_HOUR * 3_600_000);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}-${String(shifted.getDate()).padStart(2, "0")}`;
}

/** 다음 08:00까지 남은 시간(ms). 이때 목록을 비운다. */
export function msUntilNextReset(now: Date): number {
  const next = new Date(now);
  next.setHours(DAY_RESET_HOUR, 0, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

/** 최근 인식 목록에 남기는 최대 개수(사용자 결정, DEC-108). 넘으면 가장 오래된 항목부터 지운다. */
export const MAX_RECENT = 30;

/** 최근 인식 목록의 한 줄. 인식 실패는 신원이 없어 남기지 않는다(DEC-110). */
export type RecentEntry = {
  id: string;
  kind: "success" | "alreadyDone";
  /** `학번 이름`. */
  label: string;
  /** 인식한 시각 `HH:mm`. */
  time: string;
  /** 인식한 운영일(`YYYY-MM-DD`, 08:00 기준). 운영일이 바뀌면 지난 날의 줄을 지우는 데 쓴다. */
  day: string;
};

/** 이번 프레임 결과의 목록 줄. id를 만들어 순수하지 않으니 상태 갱신 함수 밖에서 부른다. 프레임 안에서는 성공, 이미 처리됨 순이다. */
export function newEntries(
  outcome: Pick<FrameOutcome, "success" | "alreadyDone">,
  at: Date,
): RecentEntry[] {
  const time = `${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}`;
  const day = operatingDay(at);
  const entry = (kind: RecentEntry["kind"], label: string): RecentEntry => ({
    id: crypto.randomUUID(),
    kind,
    label,
    time,
    day,
  });
  return [
    ...outcome.success.map((label) => entry("success", label)),
    ...outcome.alreadyDone.map((label) => entry("alreadyDone", label)),
  ];
}

/** 새 줄을 목록 맨 위에 더한다(최근 것이 위). 운영일(08:00 기준)이 바뀌면 지난 날의 줄은 지우고, 최대 개수를 넘으면 가장 오래된 것부터 지운다. */
export function addRecent(
  prev: RecentEntry[],
  added: RecentEntry[],
): RecentEntry[] {
  if (added.length === 0) return prev;
  const today = prev.filter((entry) => entry.day === added[0].day);
  return [...added, ...today].slice(0, MAX_RECENT);
}

/** 화면에서 사라진 얼굴 트랙을 기억하는 시간. 잠깐 놓쳤다 돌아와도 같은 안내를 되풀이하지 않는다. */
export const TRACK_MEMORY_MS = 30_000;

export type RecognitionState = {
  /**
   * 트랙별로 마지막으로 본 시각. `done`은 그 트랙에서 이미 성공(`RECORDED`)이나 이미 처리됨(`DUPLICATE`) 안내를 보였는지다. 같은 얼굴이 계속 서 있는 동안
   * 프레임마다 안내를 되풀이하거나, 방금 성공했는데 곧바로 `이미 처리됐어요`로 바뀌지 않게 한다.
   */
  tracks: Record<string, { seenAt: number; done?: boolean }>;
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
};

/**
 * 프레임 한 장의 인식 결과를 성공·이미 처리됨으로 가른다(REQ-FACE-005~007). 순수 함수다.
 * - KNOWN이고 출석이 이번에 기록됐으면(RECORDED) 성공이다. 이미 출석해 있던 학생(DUPLICATE)은 성공이 아니라 `이미 처리됐어요`로
 *   알린다. 같은 트랙에서 한 번 알렸으면(성공이든 이미 처리됨이든) 다시 알리지 않는다. 서버가 거절한 출석(STALE·REJECTED)은
 *   아무 것도 하지 않는다.
 * - UNKNOWN은 목록에 남기지 않고(DEC-110) QR 안내도 하지 않는다(DEC-112).
 * - NOT_ATTEMPTED는 아직 시도하지 않은 얼굴이라 아무 것도 하지 않는다.
 * 얼굴마다 따로 처리해 서로의 이름을 섞지 않는다.
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

  for (const face of faces) {
    const done = tracks[face.trackId]?.done === true;
    tracks[face.trackId] = {
      seenAt: nowMs,
      ...(done ? { done: true } : {}),
    };
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
    }
  }

  return {
    state: { tracks },
    success,
    alreadyDone,
  };
}
