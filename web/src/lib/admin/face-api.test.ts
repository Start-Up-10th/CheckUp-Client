import { AdminUnauthorizedError } from "./qr-api";
import { RateLimitedError } from "./rate-limit";
import {
  FaceApiError,
  closeFaceSession,
  createFaceSession,
  sendFaceFrame,
} from "./face-api";

function face(overrides: Record<string, unknown> = {}) {
  return {
    trackId: "t1",
    bbox: [0, 0, 1, 1],
    landmarks: [],
    quality: { brightness: 0.5, sharpness: 0.5, issues: [] },
    attempts: 1,
    qrRecommended: false,
    recognition: {
      status: "KNOWN",
      studentName: "김도현",
      studentNumber: 2405,
      attendance: "RECORDED",
    },
    ...overrides,
  };
}

function mockFetch(status: number, body?: unknown) {
  const fetchMock = vi.fn().mockImplementation(
    async () =>
      new Response(body === undefined ? null : JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createFaceSession", () => {
  it("용도를 서버 값으로 바꿔 세션을 만들고 sessionId를 돌려준다", async () => {
    const fetchMock = mockFetch(201, { sessionId: "s-1", status: "ready" });

    await expect(createFaceSession("dorm")).resolves.toBe("s-1");

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/face/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ purpose: "DORMITORY" }),
    });
  });

  it("자습실은 STUDY_ROOM이다", async () => {
    const fetchMock = mockFetch(201, { sessionId: "s-2" });

    await createFaceSession("study");

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      purpose: "STUDY_ROOM",
    });
  });

  it("401은 AdminUnauthorizedError, 그 밖은 서버 code를 담은 FaceApiError다", async () => {
    mockFetch(401);
    await expect(createFaceSession("dorm")).rejects.toBeInstanceOf(
      AdminUnauthorizedError,
    );

    mockFetch(422, { code: "FACE_NO_CANDIDATES" });
    await expect(createFaceSession("dorm")).rejects.toMatchObject({
      status: 422,
      code: "FACE_NO_CANDIDATES",
    });
  });
});

describe("closeFaceSession", () => {
  it("페이지를 떠나도 끝까지 가도록 keepalive DELETE로 보낸다", () => {
    const fetchMock = mockFetch(204);

    closeFaceSession("s 1");

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/face/sessions/s%201", {
      method: "DELETE",
      credentials: "include",
      keepalive: true,
    });
  });

  it("실패해도 예외를 밖으로 내지 않는다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    expect(() => closeFaceSession("s-1")).not.toThrow();
    await Promise.resolve();
  });
});

describe("sendFaceFrame", () => {
  const frame = new Blob([new Uint8Array([1, 2, 3])], { type: "image/jpeg" });

  it("JPEG 원본과 X-Frame-Id를 보내고 결과를 화면 모델로 바꾼다", async () => {
    const fetchMock = mockFetch(200, { frameId: "f-1", faces: [face()] });

    const result = await sendFaceFrame("s-1", frame, "f-1");

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/face/sessions/s-1/frames", {
      method: "POST",
      headers: { "Content-Type": "image/jpeg", "X-Frame-Id": "f-1" },
      credentials: "include",
      body: frame,
    });
    expect(result).toEqual({
      frameId: "f-1",
      faces: [
        {
          trackId: "t1",
          status: "KNOWN",
          studentName: "김도현",
          studentNumber: 2405,
          attendance: "RECORDED",
          attempts: 1,
          qrRecommended: false,
        },
      ],
    });
  });

  it("UNKNOWN 얼굴은 이름·학번과 출석 결과가 없다", async () => {
    mockFetch(200, {
      frameId: "f-1",
      faces: [
        face({
          recognition: { status: "UNKNOWN" },
          attempts: 2,
          qrRecommended: true,
        }),
      ],
    });

    const [unknown] = (await sendFaceFrame("s-1", frame, "f-1")).faces;

    expect(unknown).toMatchObject({
      status: "UNKNOWN",
      attempts: 2,
      qrRecommended: true,
    });
    expect(unknown.studentName).toBeUndefined();
    expect(unknown.studentNumber).toBeUndefined();
    expect(unknown.attendance).toBeUndefined();
  });

  it.each([
    ["이름이 없음", { studentName: null, studentNumber: 2405 }],
    ["이름이 빈 문자열", { studentName: "  ", studentNumber: 2405 }],
    ["학번이 없음", { studentName: "김도현", studentNumber: null }],
    ["학번이 숫자가 아님", { studentName: "김도현", studentNumber: "x" }],
    ["이전 형식(studentId만 있음)", { studentId: "1234" }],
  ])(
    "KNOWN인데 %s이면 신원을 만들지 않고 UNKNOWN으로 둔다",
    async (_label, fields) => {
      mockFetch(200, {
        frameId: "f-1",
        faces: [
          face({
            recognition: { status: "KNOWN", attendance: "RECORDED", ...fields },
          }),
        ],
      });

      const [broken] = (await sendFaceFrame("s-1", frame, "f-1")).faces;

      expect(broken.status).toBe("UNKNOWN");
      expect(broken.studentName).toBeUndefined();
      expect(broken.studentNumber).toBeUndefined();
      expect(broken.attendance).toBeUndefined();
    },
  );

  it("모르는 상태 값은 NOT_ATTEMPTED로 둔다", async () => {
    mockFetch(200, {
      frameId: "f-1",
      faces: [face({ recognition: { status: "SOMETHING_NEW" } })],
    });

    const [other] = (await sendFaceFrame("s-1", frame, "f-1")).faces;

    expect(other.status).toBe("NOT_ATTEMPTED");
  });

  it("여러 얼굴은 트랙별로 따로 돌려준다", async () => {
    mockFetch(200, {
      frameId: "f-1",
      faces: [
        face({ trackId: "a" }),
        face({
          trackId: "b",
          recognition: { status: "UNKNOWN" },
          attempts: 3,
        }),
      ],
    });

    const { faces } = await sendFaceFrame("s-1", frame, "f-1");

    expect(faces.map((f) => [f.trackId, f.status])).toEqual([
      ["a", "KNOWN"],
      ["b", "UNKNOWN"],
    ]);
  });

  it.each([
    [404, "FACE_SESSION_NOT_FOUND"],
    [503, "FACE_AI_UNAVAILABLE"],
  ])("%s는 서버 code %s를 담은 FaceApiError다", async (status, code) => {
    mockFetch(status, { code });

    const error = await sendFaceFrame("s-1", frame, "f-1").catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(FaceApiError);
    expect(error).toMatchObject({ status, code });
  });

  it("429는 Retry-After를 담은 RateLimitedError다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: "FACE_FRAME_RATE_LIMITED" }), {
          status: 429,
          headers: { "Retry-After": "2" },
        }),
      ),
    );

    const error = await sendFaceFrame("s-1", frame, "f-1").catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(RateLimitedError);
    expect((error as RateLimitedError).retryAfterMs).toBe(2000);
  });

  it("401은 AdminUnauthorizedError다", async () => {
    mockFetch(401);

    await expect(sendFaceFrame("s-1", frame, "f-1")).rejects.toBeInstanceOf(
      AdminUnauthorizedError,
    );
  });
});
