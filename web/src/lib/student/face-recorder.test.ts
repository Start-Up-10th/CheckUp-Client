import { pickFaceVideoType, startFaceRecording } from "./face-recorder";

/** 브라우저 MediaRecorder 대역. `emit`으로 영상 조각을 흘려보낸다(실제 영상이 아닌 테스트용 바이트). */
class FakeRecorder {
  static supported: string[] = ["video/webm"];
  static last: FakeRecorder | null = null;
  static isTypeSupported(type: string) {
    return FakeRecorder.supported.includes(type);
  }

  state: "inactive" | "recording" = "inactive";
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(
    readonly stream: MediaStream,
    readonly options: { mimeType: string },
  ) {
    FakeRecorder.last = this;
  }

  start() {
    this.state = "recording";
  }

  stop() {
    this.state = "inactive";
    this.onstop?.();
  }

  emit(text: string) {
    this.ondataavailable?.({ data: new Blob([text]) });
  }
}

const STREAM = {} as MediaStream;

beforeEach(() => {
  FakeRecorder.supported = ["video/webm"];
  FakeRecorder.last = null;
  vi.stubGlobal("MediaRecorder", FakeRecorder);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("pickFaceVideoType", () => {
  it("webm을 녹화할 수 있으면 webm", () => {
    FakeRecorder.supported = ["video/webm", "video/mp4"];

    expect(pickFaceVideoType()).toBe("video/webm");
  });

  it("webm이 안 되고 mp4가 되면 mp4(아이폰 사파리)", () => {
    FakeRecorder.supported = ["video/mp4"];

    expect(pickFaceVideoType()).toBe("video/mp4");
  });

  it("서버가 받는 형식을 녹화할 수 없으면 null", () => {
    FakeRecorder.supported = ["video/x-matroska"];

    expect(pickFaceVideoType()).toBeNull();
  });

  it("녹화를 지원하지 않는 브라우저면 null", () => {
    vi.stubGlobal("MediaRecorder", undefined);

    expect(pickFaceVideoType()).toBeNull();
  });
});

describe("startFaceRecording", () => {
  it("카메라 영상을 고른 형식으로 녹화하기 시작한다", () => {
    startFaceRecording(STREAM);

    expect(FakeRecorder.last?.stream).toBe(STREAM);
    expect(FakeRecorder.last?.options).toEqual({ mimeType: "video/webm" });
    expect(FakeRecorder.last?.state).toBe("recording");
  });

  it("녹화할 수 없는 브라우저면 null", () => {
    FakeRecorder.supported = [];

    expect(startFaceRecording(STREAM)).toBeNull();
    expect(FakeRecorder.last).toBeNull();
  });

  it("끝내면 모은 조각을 영상 하나로 돌려준다", async () => {
    const recording = startFaceRecording(STREAM)!;
    FakeRecorder.last!.emit("ab");
    FakeRecorder.last!.emit("cd");

    const video = await recording.finish();

    expect(video.type).toBe("video/webm");
    expect(await video.text()).toBe("abcd");
    expect(FakeRecorder.last?.state).toBe("inactive");
  });

  it("조각이 하나도 없으면 오류", async () => {
    const recording = startFaceRecording(STREAM)!;

    await expect(recording.finish()).rejects.toThrow("faceRecording: empty");
  });

  it("녹화 중 오류가 나면 조각을 버리고 오류", async () => {
    const recording = startFaceRecording(STREAM)!;
    const recorder = FakeRecorder.last!;
    recorder.emit("ab");
    // 실제 녹화기처럼 멈춤 통지가 늦게 오는 경우
    recorder.stop = () => {
      recorder.state = "inactive";
    };

    const result = recording.finish();
    recorder.onerror?.();

    await expect(result).rejects.toThrow("faceRecording: failed");
    expect(recorder.ondataavailable).toBeNull();
  });

  it("버리면 녹화를 멈추고 이후 조각을 받지 않으며, 끝내기는 오류다", async () => {
    const recording = startFaceRecording(STREAM)!;
    const recorder = FakeRecorder.last!;
    recorder.emit("ab");

    recording.discard();
    recording.discard();

    expect(recorder.state).toBe("inactive");
    expect(recorder.ondataavailable).toBeNull();
    await expect(recording.finish()).rejects.toThrow(
      "faceRecording: not recording",
    );
  });
});
