import type { FaceResult } from "./face-api";
import {
  INITIAL_RECOGNITION,
  MAX_TOASTS_PER_FRAME,
  QR_NOTICE_ATTEMPTS,
  TRACK_MEMORY_MS,
  applyFrame,
  alreadyDoneMessage,
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

    expect(success).toEqual(["2405 김도현"]);
    expect(failure).toBe(false);
  });

  it("이미 출석해 있던 학생(DUPLICATE)은 성공이 아니라 이미 처리됨으로 알린다", () => {
    const { success, alreadyDone } = run(INITIAL_RECOGNITION, [
      known({ attendance: "DUPLICATE" }),
    ]);

    expect(success).toEqual([]);
    expect(alreadyDone).toEqual(["2405 김도현"]);
    expect(alreadyDoneMessage("2405 김도현")).toBe(
      "이미 처리됐어요 · 2405 김도현",
    );
  });

  it("이번에 기록된 학생(RECORDED)은 성공이고 이미 처리됨은 아니다", () => {
    const { success, alreadyDone } = run(INITIAL_RECOGNITION, [known()]);

    expect(success).toEqual(["2405 김도현"]);
    expect(alreadyDone).toEqual([]);
  });

  it("같은 얼굴이 계속 서 있어도 성공 뒤에 곧바로 이미 처리됨으로 바뀌지 않는다", () => {
    const first = run(INITIAL_RECOGNITION, [known()]);
    const next = run(first.state, [known({ attendance: "DUPLICATE" })]);

    expect(first.success).toEqual(["2405 김도현"]);
    expect(next.success).toEqual([]);
    expect(next.alreadyDone).toEqual([]);
  });

  it("이미 처리됨은 같은 얼굴 트랙에서 한 번만 알린다", () => {
    const first = run(INITIAL_RECOGNITION, [
      known({ attendance: "DUPLICATE" }),
    ]);
    const next = run(first.state, [known({ attendance: "DUPLICATE" })]);

    expect(first.alreadyDone).toEqual(["2405 김도현"]);
    expect(next.alreadyDone).toEqual([]);
  });

  it("성공한 학생이 나갔다 다른 트랙으로 다시 인식되면 이미 처리됨으로 알린다", () => {
    const first = run(INITIAL_RECOGNITION, [known({ trackId: "a" })]);
    const later = new Date(NOW.getTime() + TRACK_MEMORY_MS + 1);
    const again = run(
      first.state,
      [known({ trackId: "b", attendance: "DUPLICATE" })],
      later,
    );

    expect(again.success).toEqual([]);
    expect(again.alreadyDone).toEqual(["2405 김도현"]);
  });

  it("서버가 거절한 출석(STALE·REJECTED)은 성공으로 세지 않는다", () => {
    for (const attendance of ["STALE", "REJECTED"] as const) {
      const outcome = run(INITIAL_RECOGNITION, [known({ attendance })]);
      expect(outcome.success).toEqual([]);
      expect(outcome.alreadyDone).toEqual([]);
    }
  });

  it("이름이나 학번이 없는 KNOWN은 신원을 만들지 않는다", () => {
    expect(
      run(INITIAL_RECOGNITION, [known({ studentName: undefined })]).success,
    ).toEqual([]);
    expect(
      run(INITIAL_RECOGNITION, [known({ studentNumber: undefined })]).success,
    ).toEqual([]);
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

    expect(outcome.success).toEqual([]);
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

    expect(outcome.success).toEqual(["2405 김도현"]);
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

  describe("다른 층 학생", () => {
    const otherFloor = (trackId = "o"): FaceResult => ({
      trackId,
      status: "OTHER_FLOOR",
      attempts: 1,
      qrRecommended: false,
    });

    it("실패나 QR 안내가 아니라 다른 층 학생으로 한 번만 알린다", () => {
      const first = applyFrame(INITIAL_RECOGNITION, [otherFloor()], NOW);
      const same = applyFrame(first.state, [otherFloor()], NOW);

      expect(first).toMatchObject({
        otherFloor: true,
        failure: false,
        qrRecommended: false,
        success: [],
      });
      expect(same.otherFloor).toBe(false);
    });

    it("트랙 기억 시간이 지나 다시 서면 다시 알린다", () => {
      const first = applyFrame(INITIAL_RECOGNITION, [otherFloor()], NOW);
      const later = new Date(NOW.getTime() + TRACK_MEMORY_MS + 1);

      expect(applyFrame(first.state, [otherFloor()], later).otherFloor).toBe(
        true,
      );
    });

    it("다른 얼굴의 성공을 막지 않는다", () => {
      const outcome = applyFrame(
        INITIAL_RECOGNITION,
        [otherFloor("o"), known()],
        NOW,
      );

      expect(outcome.otherFloor).toBe(true);
      expect(outcome.success).toEqual(["2405 김도현"]);
    });
  });

  describe("한 프레임에 여러 명(DEC-101)", () => {
    const people = [2401, 2402, 2403, 2404, 2405, 2406, 2407];
    const many = (attendance: "RECORDED" | "DUPLICATE", count = 3) =>
      people.slice(0, count).map((n) =>
        known({
          trackId: `k${n}`,
          studentNumber: n,
          studentName: `학생${n}`,
          attendance,
        }),
      );

    it("성공한 학생마다 알린다", () => {
      const outcome = run(INITIAL_RECOGNITION, many("RECORDED"));

      expect(outcome.success).toEqual([
        "2401 학생2401",
        "2402 학생2402",
        "2403 학생2403",
      ]);
    });

    it("이미 처리된 학생도 학생마다 알린다", () => {
      expect(run(INITIAL_RECOGNITION, many("DUPLICATE")).alreadyDone).toEqual([
        "2401 학생2401",
        "2402 학생2402",
        "2403 학생2403",
      ]);
    });

    it(`한 프레임에 최대 ${MAX_TOASTS_PER_FRAME}명까지만 알리고, 넘는 학생은 다음 프레임에도 알리지 않는다`, () => {
      const first = run(INITIAL_RECOGNITION, many("RECORDED", 7));
      const next = run(first.state, many("RECORDED", 7));

      expect(first.success).toHaveLength(MAX_TOASTS_PER_FRAME);
      expect(next.success).toEqual([]);
    });
  });
});
