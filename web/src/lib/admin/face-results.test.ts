import type { FaceResult } from "./face-api";
import {
  INITIAL_RECOGNITION,
  MAX_RECENT,
  addRecent,
  msUntilNextReset,
  newEntries,
  QR_NOTICE_ATTEMPTS,
  TRACK_MEMORY_MS,
  applyFrame,
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
    expect(failure).toBe(0);
  });

  it("이미 출석해 있던 학생(DUPLICATE)은 성공이 아니라 이미 처리됨으로 알린다", () => {
    const { success, alreadyDone } = run(INITIAL_RECOGNITION, [
      known({ attendance: "DUPLICATE" }),
    ]);

    expect(success).toEqual([]);
    expect(alreadyDone).toEqual(["2405 김도현"]);
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
    expect(outcome.failure).toBe(0);
    expect(outcome.qrRecommended).toBe(false);
  });
});

describe("applyFrame 실패 표시", () => {
  it("트랙의 시도 횟수가 늘었을 때만 failure다", () => {
    const first = run(INITIAL_RECOGNITION, [unknown("t1", 1)]);
    const same = run(first.state, [unknown("t1", 1)]);
    const next = run(same.state, [unknown("t1", 2)]);

    expect([first.failure, same.failure, next.failure]).toEqual([1, 0, 1]);
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

    expect(soon.failure).toBe(0);
    expect(later.failure).toBe(1);
  });

  it("한 프레임의 여러 얼굴은 서로 섞이지 않는다", () => {
    const outcome = run(INITIAL_RECOGNITION, [known(), unknown("t1", 1)]);

    expect(outcome.success).toEqual(["2405 김도현"]);
    expect(outcome.failure).toBe(1);
  });

  it("성공만 있는 프레임은 failure가 아니다", () => {
    expect(run(INITIAL_RECOGNITION, [known()]).failure).toBe(0);
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

describe("한 프레임에 여러 명", () => {
  const many = (count: number) =>
    Array.from({ length: count }, (_, i) =>
      known({
        trackId: `k${i}`,
        studentNumber: 2401 + i,
        studentName: `학생${i}`,
      }),
    );

  it("성공한 학생을 모두 알린다(상한 없음)", () => {
    expect(run(INITIAL_RECOGNITION, many(7)).success).toHaveLength(7);
  });

  it("실패한 얼굴 수를 센다", () => {
    const outcome = run(INITIAL_RECOGNITION, [
      unknown("a", 1),
      unknown("b", 1),
    ]);

    expect(outcome.failure).toBe(2);
  });
});

describe("newEntries·addRecent", () => {
  const at = new Date(2026, 9, 28, 22, 4);
  const none = {
    success: [] as string[],
    alreadyDone: [] as string[],
    failure: 0,
  };
  const entries = (o: Partial<typeof none>, when = at) =>
    newEntries({ ...none, ...o }, when);

  it("최근 것을 맨 위에 두고 시각을 `HH:mm`으로 남긴다. 실패에는 이름이 없다", () => {
    const first = addRecent([], entries({ success: ["2405 김도현"] }));
    const list = addRecent(
      first,
      entries({ failure: 1 }, new Date(2026, 9, 28, 22, 6)),
    );

    expect(list.map(({ kind, label, time }) => [kind, label, time])).toEqual([
      ["failure", undefined, "22:06"],
      ["success", "2405 김도현", "22:04"],
    ]);
  });

  it("새벽은 전날로 세고 08:00에 운영일이 바뀐다", () => {
    const night = addRecent(
      [],
      entries({ failure: 1 }, new Date(2026, 9, 28, 23, 50)),
    );
    const dawn = addRecent(
      night,
      entries({ failure: 1 }, new Date(2026, 9, 29, 7, 59)),
    );
    const morning = addRecent(
      dawn,
      entries({ failure: 1 }, new Date(2026, 9, 29, 8, 0)),
    );

    expect(dawn).toHaveLength(2);
    expect(morning).toHaveLength(1);
  });

  it("다음 08:00까지 남은 시간을 센다", () => {
    expect(msUntilNextReset(new Date(2026, 9, 28, 7, 59, 0))).toBe(60_000);
    expect(msUntilNextReset(new Date(2026, 9, 28, 8, 0, 0))).toBe(
      24 * 3_600_000,
    );
    expect(msUntilNextReset(new Date(2026, 9, 28, 22, 0, 0))).toBe(
      10 * 3_600_000,
    );
  });

  it("날짜가 바뀌면 지난 날의 줄은 지운다", () => {
    const prev = addRecent([], entries({ failure: 1 }));
    const next = addRecent(
      prev,
      entries({ failure: 1 }, new Date(2026, 9, 29, 8, 0)),
    );

    expect(next.map((entry) => entry.day)).toEqual(["2026-10-29"]);
  });

  it("결과가 없으면 목록을 그대로 둔다", () => {
    const prev = addRecent([], entries({ failure: 1 }));

    expect(addRecent(prev, entries({}))).toBe(prev);
  });

  it(`${MAX_RECENT}개를 넘으면 가장 오래된 것부터 지운다`, () => {
    const full = addRecent(
      [],
      entries({
        success: Array.from({ length: MAX_RECENT }, (_, i) => `n${i}`),
      }),
    );
    const list = addRecent(full, entries({ failure: 1 }));

    expect(list).toHaveLength(MAX_RECENT);
    expect(list[0].kind).toBe("failure");
    expect(list.at(-1)?.label).toBe(`n${MAX_RECENT - 2}`);
  });
});
