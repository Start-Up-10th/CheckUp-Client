import type { FaceResult } from "./face-api";
import {
  INITIAL_RECOGNITION,
  MAX_ENTRIES,
  SUCCESS_DEDUPE_MS,
  TRACK_MEMORY_MS,
  applyFrame,
  successMessage,
  type RecognitionState,
} from "./face-results";

// 2026-10-02 22:04 KST
const NOW = new Date("2026-10-02T13:04:00Z");

const LABELS: Record<number, { studentNumber: number; name: string }> = {
  101: { studentNumber: 2405, name: "김도현" },
  102: { studentNumber: 2412, name: "박서연" },
};
const lookup = (id: number) => LABELS[id];

function known(
  studentId: number,
  overrides: Partial<FaceResult> = {},
): FaceResult {
  return {
    trackId: `k${studentId}`,
    status: "KNOWN",
    studentId,
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
  return applyFrame(state, faces, at, lookup);
}

describe("applyFrame 성공", () => {
  it("KNOWN은 `학번 이름` 성공 행과 한국 시각을 만든다", () => {
    const { state, success } = run(INITIAL_RECOGNITION, [known(101)]);

    expect(state.entries).toEqual([
      {
        id: "1",
        label: "2405 김도현",
        outcome: "success",
        recognizedAt: "22:04",
      },
    ]);
    expect(success).toBe(state.entries[0]);
  });

  it("이미 출석(DUPLICATE)도 성공으로 보여 준다", () => {
    const { state } = run(INITIAL_RECOGNITION, [
      known(101, { attendance: "DUPLICATE" }),
    ]);

    expect(state.entries).toHaveLength(1);
  });

  it("서버가 거절한 출석(STALE·REJECTED)은 성공 행을 만들지 않는다", () => {
    for (const attendance of ["STALE", "REJECTED"] as const) {
      const { state, success } = run(INITIAL_RECOGNITION, [
        known(101, { attendance }),
      ]);

      expect(state.entries).toEqual([]);
      expect(success).toBeNull();
    }
  });

  it("명단에서 이름을 찾지 못하면 이름을 지어내지 않고 `인식 성공`이다", () => {
    const { state } = run(INITIAL_RECOGNITION, [known(999)]);

    expect(state.entries[0].label).toBe("인식 성공");
  });

  it("같은 학생은 10초 안에 다시 올리지 않고 지나면 다시 올린다", () => {
    const first = run(INITIAL_RECOGNITION, [known(101)]);
    const soon = new Date(NOW.getTime() + SUCCESS_DEDUPE_MS - 1);
    const again = run(first.state, [known(101)], soon);
    const later = new Date(NOW.getTime() + SUCCESS_DEDUPE_MS);
    const afterWindow = run(again.state, [known(101)], later);

    expect(again.state.entries).toHaveLength(1);
    expect(again.success).toBeNull();
    expect(afterWindow.state.entries).toHaveLength(2);
  });
});

describe("applyFrame 실패", () => {
  it("UNKNOWN은 신원 없는 인식 실패 행이다", () => {
    const { state } = run(INITIAL_RECOGNITION, [unknown("t1", 1)]);

    expect(state.entries).toEqual([
      {
        id: "1",
        label: "인식 실패",
        outcome: "failure",
        recognizedAt: "22:04",
      },
    ]);
  });

  it("같은 시도(attempts)가 프레임마다 와도 한 번만 센다", () => {
    let state = run(INITIAL_RECOGNITION, [unknown("t1", 1)]).state;
    state = run(state, [unknown("t1", 1)]).state;
    state = run(state, [unknown("t1", 1)]).state;

    expect(state.entries).toHaveLength(1);
  });

  it("시도 횟수가 늘면 그때마다 한 행씩 올린다", () => {
    let state = run(INITIAL_RECOGNITION, [unknown("t1", 1)]).state;
    state = run(state, [unknown("t1", 2)]).state;

    expect(state.entries.map((e) => e.outcome)).toEqual(["failure", "failure"]);
  });

  it("시도 횟수가 0이거나 NOT_ATTEMPTED면 아무 행도 만들지 않는다", () => {
    const { state } = run(INITIAL_RECOGNITION, [
      unknown("t1", 0),
      { ...unknown("t2", 1), status: "NOT_ATTEMPTED" },
    ]);

    expect(state.entries).toEqual([]);
  });

  it("얼굴이 잠깐 사라졌다 돌아와도 같은 시도를 다시 세지 않는다", () => {
    let state = run(INITIAL_RECOGNITION, [unknown("t1", 1)]).state;
    state = run(state, []).state;
    state = run(state, [unknown("t1", 1)]).state;

    expect(state.entries).toHaveLength(1);
  });

  it("오래 사라진 트랙은 잊어 다시 센다", () => {
    let state = run(INITIAL_RECOGNITION, [unknown("t1", 1)]).state;
    const later = new Date(NOW.getTime() + TRACK_MEMORY_MS + 1);
    state = run(state, [], later).state;
    state = run(state, [unknown("t1", 1)], later).state;

    expect(state.entries).toHaveLength(2);
  });
});

describe("applyFrame 여러 얼굴", () => {
  it("한 명은 성공, 다른 한 명은 실패로 따로 처리하고 이름·횟수를 섞지 않는다", () => {
    const { state } = run(INITIAL_RECOGNITION, [known(101), unknown("t9", 1)]);

    expect(state.entries.map((e) => [e.label, e.outcome])).toEqual([
      ["인식 실패", "failure"],
      ["2405 김도현", "success"],
    ]);
  });

  it("성공한 학생이 있어도 실패 얼굴의 시도는 따로 센다", () => {
    let state = run(INITIAL_RECOGNITION, [known(101), unknown("t9", 1)]).state;
    state = run(state, [known(101), unknown("t9", 2)]).state;

    expect(state.entries.filter((e) => e.outcome === "failure")).toHaveLength(
      2,
    );
    expect(state.entries.filter((e) => e.outcome === "success")).toHaveLength(
      1,
    );
  });
});

describe("applyFrame QR 안내", () => {
  it("UNKNOWN 얼굴에 서버가 QR을 권하면 qrRecommended다", () => {
    const { qrRecommended } = run(INITIAL_RECOGNITION, [
      unknown("t1", 4, { qrRecommended: true }),
    ]);

    expect(qrRecommended).toBe(true);
  });

  it("성공한 얼굴이나 권하지 않은 얼굴은 QR을 안내하지 않는다", () => {
    expect(
      run(INITIAL_RECOGNITION, [
        known(101, { qrRecommended: true }),
        unknown("t1", 2),
      ]).qrRecommended,
    ).toBe(false);
  });
});

describe("applyFrame 목록", () => {
  it("최신 행이 앞에 오고 최대 개수를 넘으면 오래된 행을 버린다", () => {
    let state = INITIAL_RECOGNITION;
    for (let i = 1; i <= MAX_ENTRIES + 5; i += 1) {
      state = run(state, [unknown(`t${i}`, 1)]).state;
    }

    expect(state.entries).toHaveLength(MAX_ENTRIES);
    expect(state.entries[0].id).toBe(String(MAX_ENTRIES + 5));
  });

  it("입력 상태를 바꾸지 않는다", () => {
    const frozen = Object.freeze({
      ...INITIAL_RECOGNITION,
      entries: Object.freeze([]) as unknown as RecognitionState["entries"],
    });

    expect(() => run(frozen, [known(101), unknown("t1", 1)])).not.toThrow();
    expect(INITIAL_RECOGNITION.entries).toEqual([]);
  });
});

describe("successMessage", () => {
  it("`성공 · 학번 이름`이다", () => {
    const { success } = run(INITIAL_RECOGNITION, [known(101)]);

    expect(successMessage(success!)).toBe("성공 · 2405 김도현");
  });

  it("이름을 모르면 이름 없이 `성공`만 쓴다", () => {
    const { success } = run(INITIAL_RECOGNITION, [known(999)]);

    expect(successMessage(success!)).toBe("성공");
  });
});

describe("applyFrame 실패 표시", () => {
  it("새 실패 행이 생긴 프레임만 failure다", () => {
    const first = run(INITIAL_RECOGNITION, [unknown("t1", 1)]);
    const same = run(first.state, [unknown("t1", 1)]);
    const next = run(same.state, [unknown("t1", 2)]);

    expect([first.failure, same.failure, next.failure]).toEqual([
      true,
      false,
      true,
    ]);
  });

  it("성공만 있는 프레임은 failure가 아니다", () => {
    expect(run(INITIAL_RECOGNITION, [known(101)]).failure).toBe(false);
  });
});
