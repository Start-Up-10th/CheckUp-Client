import type { FaceResult } from "./face-api";
import {
  INITIAL_RECOGNITION,
  QR_NOTICE_ATTEMPTS,
  TRACK_MEMORY_MS,
  applyFrame,
  successMessage,
  type RecognitionState,
} from "./face-results";

const NOW = new Date("2026-10-02T13:04:00Z");

function known(overrides: Partial<FaceResult> = {}): FaceResult {
  return {
    trackId: "k2405",
    status: "KNOWN",
    studentName: "김도현",
    studentNumber: 2405,
    attendance: "RECORDED",
    attempts: 1,
    qrRecommended: false,
    ...overrides,
  };
}

function unknown(
  trackId: string,
  attempts: number,
  overrides: Partial<FaceResult> = {},
): FaceResult {
  return {
    trackId,
    status: "UNKNOWN",
    attempts,
    qrRecommended: false,
    ...overrides,
  };
}

function run(state: RecognitionState, faces: FaceResult[], at: Date = NOW) {
  return applyFrame(state, faces, at);
}

describe("applyFrame 성공", () => {
  it("KNOWN은 `학번 이름` 성공을 알린다", () => {
    const { success, failure } = run(INITIAL_RECOGNITION, [known()]);

    expect(success).toBe("2405 김도현");
    expect(failure).toBe(false);
  });

  it("이미 출석한 학생(DUPLICATE)도 성공 안내는 낸다", () => {
    const { success } = run(INITIAL_RECOGNITION, [
      known({ attendance: "DUPLICATE" }),
    ]);

    expect(success).toBe("2405 김도현");
  });

  it("서버가 거절한 출석(STALE·REJECTED)은 성공으로 세지 않는다", () => {
    for (const attendance of ["STALE", "REJECTED"] as const) {
      expect(run(INITIAL_RECOGNITION, [known({ attendance })]).success).toBe(
        null,
      );
    }
  });

  it("이름이나 학번이 없는 KNOWN은 신원을 만들지 않는다", () => {
    expect(
      run(INITIAL_RECOGNITION, [known({ studentName: undefined })]).success,
    ).toBe(null);
    expect(
      run(INITIAL_RECOGNITION, [known({ studentNumber: undefined })]).success,
    ).toBe(null);
  });

  it("NOT_ATTEMPTED는 아무 것도 알리지 않는다", () => {
    const outcome = run(INITIAL_RECOGNITION, [
      {
        trackId: "n",
        status: "NOT_ATTEMPTED",
        attempts: 0,
        qrRecommended: false,
      },
    ]);

    expect(outcome.success).toBe(null);
    expect(outcome.failure).toBe(false);
    expect(outcome.qrRecommended).toBe(false);
  });
});

describe("applyFrame 실패 표시", () => {
  it("트랙의 시도 횟수가 늘었을 때만 failure다", () => {
    const first = run(INITIAL_RECOGNITION, [unknown("t1", 1)]);
    const same = run(first.state, [unknown("t1", 1)]);
    const next = run(same.state, [unknown("t1", 2)]);

    expect([first.failure, same.failure, next.failure]).toEqual([
      true,
      false,
      true,
    ]);
  });

  it("화면에서 사라진 트랙은 기억 시간 안에서만 시도 횟수를 이어 센다", () => {
    const first = run(INITIAL_RECOGNITION, [unknown("t1", 2)]);
    const soon = run(
      first.state,
      [unknown("t1", 2)],
      new Date(NOW.getTime() + TRACK_MEMORY_MS),
    );
    const later = run(
      first.state,
      [unknown("t1", 2)],
      new Date(NOW.getTime() + TRACK_MEMORY_MS + 1),
    );

    expect(soon.failure).toBe(false);
    expect(later.failure).toBe(true);
  });

  it("한 프레임의 여러 얼굴은 서로 섞이지 않는다", () => {
    const outcome = run(INITIAL_RECOGNITION, [known(), unknown("t1", 1)]);

    expect(outcome.success).toBe("2405 김도현");
    expect(outcome.failure).toBe(true);
  });

  it("성공만 있는 프레임은 failure가 아니다", () => {
    expect(run(INITIAL_RECOGNITION, [known()]).failure).toBe(false);
  });
});

describe("applyFrame QR 안내", () => {
  it("UNKNOWN 얼굴에 서버가 QR을 권하면 qrRecommended다", () => {
    const { qrRecommended } = run(INITIAL_RECOGNITION, [
      unknown("t1", 1, { qrRecommended: true }),
    ]);

    expect(qrRecommended).toBe(true);
  });

  it("서버 권고가 없어도 같은 얼굴이 3회 실패하면 QR을 안내한다", () => {
    expect(
      run(INITIAL_RECOGNITION, [unknown("t1", QR_NOTICE_ATTEMPTS - 1)])
        .qrRecommended,
    ).toBe(false);
    expect(
      run(INITIAL_RECOGNITION, [unknown("t1", QR_NOTICE_ATTEMPTS)])
        .qrRecommended,
    ).toBe(true);
  });

  it("성공한 얼굴이나 권하지 않은 얼굴은 QR을 안내하지 않는다", () => {
    expect(
      run(INITIAL_RECOGNITION, [
        known({ qrRecommended: true }),
        unknown("t1", 2),
      ]).qrRecommended,
    ).toBe(false);
  });
});

describe("applyFrame 상태", () => {
  it("입력 상태를 바꾸지 않는다", () => {
    const frozen = Object.freeze({
      tracks: Object.freeze({}) as RecognitionState["tracks"],
    });

    expect(() => run(frozen, [known(), unknown("t1", 1)])).not.toThrow();
    expect(INITIAL_RECOGNITION.tracks).toEqual({});
  });
});

describe("successMessage", () => {
  it("`성공 · 학번 이름`이다", () => {
    expect(successMessage("2405 김도현")).toBe("성공 · 2405 김도현");
  });
});
