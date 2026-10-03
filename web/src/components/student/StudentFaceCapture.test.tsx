import { act, fireEvent, render, screen } from "@testing-library/react";
import { StudentFaceCapture } from "./StudentFaceCapture";

const mocks = vi.hoisted(() => {
  const router = { push: vi.fn(), replace: vi.fn() };
  return {
    router,
    isLaptop: { current: false as boolean | null },
    cameraEnabled: [] as boolean[],
    videoType: { current: "video/webm" as string | null },
    finish: vi.fn(),
    discard: vi.fn(),
    startFaceRecording: vi.fn(),
  };
});

vi.mock("next/navigation", () => ({ useRouter: () => mocks.router }));
vi.mock("next/font/google", () => ({
  Roboto_Mono: () => ({ className: "mono" }),
}));
vi.mock("@/lib/student/use-is-laptop", () => ({
  useIsLaptop: () => mocks.isLaptop.current,
}));
// 카메라 대역: 켜도 되면(enabled) 바로 준비된 것으로 본다.
vi.mock("@/lib/student/use-face-camera", () => ({
  useFaceCamera: ({ enabled }: { enabled: boolean }) => {
    mocks.cameraEnabled.push(enabled);
    return {
      videoRef: { current: null },
      status: enabled ? "ready" : "requesting",
      stream: enabled ? {} : null,
    };
  },
}));
vi.mock("@/lib/student/face-recorder", () => ({
  pickFaceVideoType: () => mocks.videoType.current,
  startFaceRecording: mocks.startFaceRecording,
}));

type Reply = { status: number; body?: unknown };

/** `/face/me`와 `/face/enrollments` 응답을 정한다. 등록 응답은 부를 때마다 차례로 쓴다. */
function mockApi(me: Reply, enrollments: Reply[] = []) {
  const queue = [...enrollments];
  const toResponse = ({ status, body }: Reply) =>
    new Response(body === undefined ? null : JSON.stringify(body), { status });
  const fetchMock = vi.fn(async (...[url]: [string, RequestInit?]) =>
    url === "/api/v1/face/me"
      ? toResponse(me)
      : toResponse(queue.shift() ?? { status: 500 }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function enrollCalls(fetchMock: ReturnType<typeof mockApi>) {
  return fetchMock.mock.calls.filter(
    ([url]) => url === "/api/v1/face/enrollments",
  );
}

const READY: Reply = {
  status: 200,
  body: { consented: true, enrolled: false },
};

/** 대기 중인 응답을 처리하고 가짜 시계를 ms만큼 돌린다. */
async function advance(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

/** 3→2→1 카운트다운을 끝낸다. 1초마다 화면이 다시 그려져야 다음 1초가 시작된다. */
async function countdown() {
  await advance(1000);
  await advance(1000);
  await advance(1000);
}

/** 들어와서 카운트다운(3초)과 촬영(3초)이 끝난 완료 단계까지 간다. */
async function renderUntilDone() {
  render(<StudentFaceCapture />);
  await advance();
  await countdown();
  await advance(3000);
}

const completeButton = () => screen.getByRole("button", { name: "완료" });
const retakeButton = () => screen.getByRole("button", { name: "다시 찍기" });

beforeEach(() => {
  vi.useFakeTimers();
  mocks.isLaptop.current = false;
  mocks.videoType.current = "video/webm";
  mocks.cameraEnabled.length = 0;
  // 실제 영상이 아닌 테스트용 바이트다.
  mocks.finish.mockImplementation(
    async () => new Blob(["test"], { type: "video/webm" }),
  );
  mocks.startFaceRecording.mockImplementation(() => ({
    finish: mocks.finish,
    discard: mocks.discard,
  }));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("StudentFaceCapture 들어올 때", () => {
  it("상태를 확인하기 전에는 카메라를 켜지 않는다", async () => {
    mockApi(READY);
    render(<StudentFaceCapture />);

    expect(mocks.cameraEnabled).toEqual([false]);

    await advance();

    expect(mocks.cameraEnabled.at(-1)).toBe(true);
  });

  it("이미 등록했으면 학생 홈으로 가고 카메라를 켜지 않는다", async () => {
    mockApi({ status: 200, body: { consented: true, enrolled: true } });
    render(<StudentFaceCapture />);
    await advance();

    expect(mocks.router.replace).toHaveBeenCalledWith("/main");
    expect(mocks.cameraEnabled).not.toContain(true);
  });

  it("얼굴 동의가 없으면 동의 화면으로 간다", async () => {
    mockApi({ status: 200, body: { consented: false, enrolled: false } });
    render(<StudentFaceCapture />);
    await advance();

    expect(mocks.router.replace).toHaveBeenCalledWith("/consent");
    expect(mocks.cameraEnabled).not.toContain(true);
  });

  it("로그인이 안 돼 있으면 로그인 화면으로 간다", async () => {
    mockApi({ status: 401 });
    render(<StudentFaceCapture />);
    await advance();

    expect(mocks.router.replace).toHaveBeenCalledWith("/login");
  });

  it("학생이 아닌 계정(403)이면 학생 전용 문구를 보여 주고 카메라를 켜지 않는다", async () => {
    mockApi({ status: 403, body: { code: "MISSING_STUDENT_INFO" } });
    render(<StudentFaceCapture />);
    await advance();

    expect(
      screen.getByText("학생 계정만 이용할 수 있어요"),
    ).toBeInTheDocument();
    expect(mocks.cameraEnabled).not.toContain(true);
  });

  it("상태 확인이 실패해도 촬영은 할 수 있다", async () => {
    mockApi({ status: 500 });
    render(<StudentFaceCapture />);
    await advance();

    expect(mocks.cameraEnabled.at(-1)).toBe(true);
    expect(screen.getByText("3초 후 자동으로 촬영합니다")).toBeInTheDocument();
  });

  it("노트북에서는 카메라를 켜지 않는다", async () => {
    mocks.isLaptop.current = true;
    mockApi(READY);
    render(<StudentFaceCapture />);
    await advance();

    expect(mocks.cameraEnabled).not.toContain(true);
  });

  it("녹화할 수 없는 브라우저면 안내를 보여 준다", async () => {
    mocks.videoType.current = null;
    mockApi(READY);
    render(<StudentFaceCapture />);
    await advance();

    expect(
      screen.getByText("이 브라우저에서는 얼굴을 등록할 수 없어요"),
    ).toBeInTheDocument();
  });
});

describe("StudentFaceCapture 촬영", () => {
  it("카운트다운이 끝난 뒤 촬영 중 단계에만 녹화한다", async () => {
    mockApi(READY);
    render(<StudentFaceCapture />);
    await advance();
    await advance(1000);
    await advance(1000);

    expect(screen.getByText("1초 후 자동으로 촬영합니다")).toBeInTheDocument();
    expect(mocks.startFaceRecording).not.toHaveBeenCalled();

    await advance(1000);

    expect(screen.getByText("촬영 중이에요")).toBeInTheDocument();
    expect(mocks.startFaceRecording).toHaveBeenCalledTimes(1);
    expect(mocks.finish).not.toHaveBeenCalled();

    await advance(3000);

    expect(mocks.finish).toHaveBeenCalledTimes(1);
    expect(screen.getByText("촬영이 완료되었어요")).toBeInTheDocument();
    expect(completeButton()).toBeEnabled();
  });

  it("촬영 중에 화면을 벗어나면 녹화를 버린다", async () => {
    mockApi(READY);
    const { unmount } = render(<StudentFaceCapture />);
    await advance();
    await countdown();

    unmount();

    expect(mocks.discard).toHaveBeenCalled();
    expect(mocks.finish).not.toHaveBeenCalled();
  });

  it("녹화가 실패하면 실패 문구를 보여 주고 완료를 막는다", async () => {
    mocks.finish.mockRejectedValue(new Error("faceRecording: empty"));
    mockApi(READY);
    await renderUntilDone();

    expect(
      screen.getByText("얼굴 등록에 실패했습니다. 다시 시도해 주세요."),
    ).toBeInTheDocument();
    expect(completeButton()).toBeDisabled();
    expect(retakeButton()).toBeEnabled();
  });

  it("다시 찍기는 서버에 보내지 않고 카운트다운부터 다시 한다", async () => {
    const fetchMock = mockApi(READY);
    await renderUntilDone();

    fireEvent.click(retakeButton());

    expect(screen.getByText("3초 후 자동으로 촬영합니다")).toBeInTheDocument();
    expect(enrollCalls(fetchMock)).toHaveLength(0);

    await countdown();
    await advance(3000);

    expect(mocks.startFaceRecording).toHaveBeenCalledTimes(2);
  });
});

describe("StudentFaceCapture 완료", () => {
  it("촬영한 영상을 보내고 등록되면 학생 홈으로 간다", async () => {
    const fetchMock = mockApi(READY, [
      { status: 201, body: { status: "REGISTERED" } },
    ]);
    await renderUntilDone();

    fireEvent.click(completeButton());

    expect(screen.getByText("얼굴을 등록하고 있어요")).toBeInTheDocument();
    expect(completeButton()).toBeDisabled();
    expect(retakeButton()).toBeDisabled();

    await advance();

    expect(mocks.router.push).toHaveBeenCalledWith("/main");
    const [, init] = enrollCalls(fetchMock)[0];
    const video = init!.body as Blob;
    expect(init!.headers).toEqual({ "Content-Type": "video/webm" });
    expect(video.size).toBe(4);
  });

  it("이미 등록돼 있으면(409) 학생 홈으로 간다", async () => {
    mockApi(READY, [
      { status: 409, body: { code: "FACE_ALREADY_REGISTERED" } },
    ]);
    await renderUntilDone();

    fireEvent.click(completeButton());
    await advance();

    expect(mocks.router.push).toHaveBeenCalledWith("/main");
  });

  it("거절되면(422) 다시 촬영 문구를 보여 주고, 영상을 버려 완료를 막는다", async () => {
    const fetchMock = mockApi(READY, [
      { status: 422, body: { code: "FACE_ENROLLMENT_REJECTED" } },
    ]);
    await renderUntilDone();

    fireEvent.click(completeButton());
    await advance();

    expect(
      screen.getByText("얼굴 인식에 실패했습니다. 다시 촬영해 주세요."),
    ).toBeInTheDocument();
    expect(mocks.router.push).not.toHaveBeenCalled();
    expect(completeButton()).toBeDisabled();
    expect(retakeButton()).toBeEnabled();

    fireEvent.click(completeButton());

    expect(enrollCalls(fetchMock)).toHaveLength(1);
  });

  it("실패 뒤 다시 찍으면 문구가 사라지고 새 영상으로 등록할 수 있다", async () => {
    const fetchMock = mockApi(READY, [
      { status: 503, body: { code: "FACE_AI_UNAVAILABLE" } },
      { status: 201, body: { status: "REGISTERED" } },
    ]);
    await renderUntilDone();

    fireEvent.click(completeButton());
    await advance();

    expect(
      screen.getByText("얼굴 등록에 실패했습니다. 다시 시도해 주세요."),
    ).toBeInTheDocument();

    fireEvent.click(retakeButton());

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await countdown();
    await advance(3000);
    fireEvent.click(completeButton());
    await advance();

    expect(enrollCalls(fetchMock)).toHaveLength(2);
    expect(mocks.router.push).toHaveBeenCalledWith("/main");
  });

  it("얼굴 동의가 없으면(403 FACE_CONSENT_REQUIRED) 동의 화면으로 간다", async () => {
    mockApi(READY, [{ status: 403, body: { code: "FACE_CONSENT_REQUIRED" } }]);
    await renderUntilDone();

    fireEvent.click(completeButton());
    await advance();

    expect(mocks.router.replace).toHaveBeenCalledWith("/consent");
  });

  it("로그인이 풀렸으면(401) 로그인 화면으로 간다", async () => {
    mockApi(READY, [{ status: 401 }]);
    await renderUntilDone();

    fireEvent.click(completeButton());
    await advance();

    expect(mocks.router.replace).toHaveBeenCalledWith("/login");
  });
});
