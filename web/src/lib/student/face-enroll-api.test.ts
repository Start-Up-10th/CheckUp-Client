import { RateLimitedError } from "@/lib/rate-limit";
import {
  FaceLoginRequiredError,
  FaceNotStudentError,
  enrollFace,
  fetchFaceStatus,
} from "./face-enroll-api";

function mockFetch(status: number, body?: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

// 실제 영상이 아닌 테스트용 바이트다.
const VIDEO = new Blob(["test"], { type: "video/webm;codecs=vp8" });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchFaceStatus", () => {
  it("세션 쿠키와 함께 본인 얼굴 상태를 조회한다", async () => {
    const fetchMock = mockFetch(200, {
      status: "NOT_REGISTERED",
      consented: true,
      eligible: false,
      enrolled: false,
    });

    await expect(fetchFaceStatus()).resolves.toEqual({
      consented: true,
      eligible: false,
      enrolled: false,
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/face/me");
    expect(init.credentials).toBe("include");
  });

  it("동의·등록 값이 없으면 아직 안 한 것으로, 등록 대상 값이 없으면 대상으로 본다", async () => {
    mockFetch(200, {});

    await expect(fetchFaceStatus()).resolves.toEqual({
      consented: false,
      eligible: true,
      enrolled: false,
    });
  });

  it("로그인하지 않았으면(401) 로그인 필요 오류", async () => {
    mockFetch(401);

    await expect(fetchFaceStatus()).rejects.toBeInstanceOf(
      FaceLoginRequiredError,
    );
  });

  it("학생이 아니면(403) 학생 아님 오류", async () => {
    mockFetch(403, { code: "MISSING_STUDENT_INFO" });

    await expect(fetchFaceStatus()).rejects.toBeInstanceOf(FaceNotStudentError);
  });

  it("500은 일반 오류", async () => {
    mockFetch(500);

    await expect(fetchFaceStatus()).rejects.toThrow("faceStatus: 500");
  });
});

describe("enrollFace", () => {
  it("영상 원본 바이트를 요청 본문으로 세션 쿠키와 함께 보낸다(학생 ID는 보내지 않는다)", async () => {
    const fetchMock = mockFetch(201, { status: "REGISTERED" });

    await enrollFace(VIDEO);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/face/enrollments");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(init.body).toBe(VIDEO);
    // 녹화기가 붙인 코덱 정보는 떼고 서버가 받는 형식만 보낸다.
    expect(init.headers).toEqual({ "Content-Type": "video/webm" });
  });

  it("mp4 영상은 video/mp4로 보낸다", async () => {
    const fetchMock = mockFetch(201, { status: "REGISTERED" });

    await enrollFace(new Blob(["test"], { type: "video/mp4;codecs=avc1" }));

    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      "Content-Type": "video/mp4",
    });
  });

  it("201이면 등록됨", async () => {
    mockFetch(201, { status: "REGISTERED" });

    await expect(enrollFace(VIDEO)).resolves.toBe("registered");
  });

  it("이미 등록돼 있으면(409) 이미 등록됨", async () => {
    mockFetch(409, { code: "FACE_ALREADY_REGISTERED" });

    await expect(enrollFace(VIDEO)).resolves.toBe("alreadyRegistered");
  });

  it.each([
    ["FACE_ENROLLMENT_LOW_LIGHT", "lowLight"],
    ["FACE_ENROLLMENT_MULTIPLE_IDENTITIES", "multipleFaces"],
    ["FACE_ENROLLMENT_REJECTED", "rejected"],
    ["본문 없음", "rejected"],
  ])("422(%s)는 거절 사유별 결과", async (code, expected) => {
    mockFetch(422, code === "본문 없음" ? undefined : { code });

    await expect(enrollFace(VIDEO)).resolves.toBe(expected);
  });

  it("얼굴 동의가 없으면(403 FACE_CONSENT_REQUIRED) 동의 필요", async () => {
    mockFetch(403, { code: "FACE_CONSENT_REQUIRED" });

    await expect(enrollFace(VIDEO)).resolves.toBe("consentRequired");
  });

  it("등록 대상이 아니면(403 FACE_ENROLLMENT_NOT_ELIGIBLE) 대상 아님", async () => {
    mockFetch(403, { code: "FACE_ENROLLMENT_NOT_ELIGIBLE" });

    await expect(enrollFace(VIDEO)).resolves.toBe("notEligible");
  });

  it.each([
    ["MISSING_STUDENT_INFO", { code: "MISSING_STUDENT_INFO" }],
    ["본문 없음", undefined],
  ])("그 밖의 403(%s)은 학생 아님 오류", async (_name, body) => {
    mockFetch(403, body);

    await expect(enrollFace(VIDEO)).rejects.toBeInstanceOf(FaceNotStudentError);
  });

  it("로그인하지 않았으면(401) 로그인 필요 오류", async () => {
    mockFetch(401);

    await expect(enrollFace(VIDEO)).rejects.toBeInstanceOf(
      FaceLoginRequiredError,
    );
  });

  it.each([400, 413, 500, 502, 503, 504])("%i는 일반 오류", async (status) => {
    mockFetch(status);

    await expect(enrollFace(VIDEO)).rejects.toThrow(`faceEnroll: ${status}`);
  });
});
describe("429 응답", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("429면 Retry-After를 담은 RateLimitedError다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        async () =>
          new Response(null, {
            status: 429,
            headers: { "Retry-After": "3" },
          }),
      ),
    );

    const error = await enrollFace(VIDEO).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(RateLimitedError);
    expect((error as RateLimitedError).retryAfterMs).toBe(3000);
  });
});
