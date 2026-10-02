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
    const fetchMock = mockFetch(200, { consented: true, enrolled: false });

    await expect(fetchFaceStatus()).resolves.toEqual({
      consented: true,
      enrolled: false,
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/face/me");
    expect(init.credentials).toBe("include");
  });

  it("값이 true가 아니면 아직 안 한 것으로 본다", async () => {
    mockFetch(200, {});

    await expect(fetchFaceStatus()).resolves.toEqual({
      consented: false,
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
  it("영상을 multipart video로 세션 쿠키와 함께 보낸다(학생 ID는 보내지 않는다)", async () => {
    const fetchMock = mockFetch(201, { status: "registered" });

    await enrollFace(VIDEO);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/face/enrollments");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    // Content-Type은 브라우저가 boundary와 함께 붙이므로 직접 정하지 않는다.
    expect(init.headers).toBeUndefined();
    const form = init.body as FormData;
    expect([...form.keys()]).toEqual(["video"]);
    const file = form.get("video") as File;
    expect(file.type).toBe("video/webm;codecs=vp8");
    expect(file.name).toBe("face.webm");
    expect(file.size).toBe(VIDEO.size);
  });

  it("mp4 영상은 mp4 파일 이름으로 보낸다", async () => {
    const fetchMock = mockFetch(201, { status: "registered" });

    await enrollFace(new Blob(["test"], { type: "video/mp4" }));

    const form = fetchMock.mock.calls[0][1].body as FormData;
    expect((form.get("video") as File).name).toBe("face.mp4");
  });

  it("201이면 등록됨", async () => {
    mockFetch(201, { status: "registered" });

    await expect(enrollFace(VIDEO)).resolves.toBe("registered");
  });

  it("이미 등록돼 있으면(409) 이미 등록됨", async () => {
    mockFetch(409, { code: "FACE_ALREADY_REGISTERED" });

    await expect(enrollFace(VIDEO)).resolves.toBe("alreadyRegistered");
  });

  it("영상이 품질 기준에 맞지 않으면(422) 거절", async () => {
    mockFetch(422, { code: "FACE_ENROLLMENT_REJECTED" });

    await expect(enrollFace(VIDEO)).resolves.toBe("rejected");
  });

  it("얼굴 동의가 없으면(403 FACE_CONSENT_REQUIRED) 동의 필요", async () => {
    mockFetch(403, { code: "FACE_CONSENT_REQUIRED" });

    await expect(enrollFace(VIDEO)).resolves.toBe("consentRequired");
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

  it.each([400, 413, 429, 500, 502, 503, 504])(
    "%i는 일반 오류",
    async (status) => {
      mockFetch(status);

      await expect(enrollFace(VIDEO)).rejects.toThrow(`faceEnroll: ${status}`);
    },
  );
});
