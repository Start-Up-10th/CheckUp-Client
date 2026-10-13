import { act, renderHook } from "@testing-library/react";
import { useQrScanner } from "./use-qr-scanner";

type Facing = "environment" | "user" | undefined;

function makeStream(facingMode: Facing) {
  const track = { stop: vi.fn(), getSettings: () => ({ facingMode }) };
  const stream = {
    getVideoTracks: () => [track],
    getTracks: () => [track],
  } as unknown as MediaStream;
  return { track, stream };
}

/** 요청한 방향 그대로 켜지는 가짜 카메라. `cameraCount`는 기기에 달린 카메라 수다. */
function stubCameras(cameraCount: number) {
  const tracks: { stop: ReturnType<typeof vi.fn> }[] = [];
  const getUserMedia = vi.fn(
    (constraints: { video: { facingMode: { ideal: Facing } } }) => {
      const { track, stream } = makeStream(constraints.video.facingMode.ideal);
      tracks.push(track);
      return Promise.resolve(stream);
    },
  );
  const enumerateDevices = vi
    .fn()
    .mockResolvedValue([
      { kind: "audioinput" },
      ...Array.from({ length: cameraCount }, () => ({ kind: "videoinput" })),
    ]);
  vi.stubGlobal("navigator", {
    ...navigator,
    mediaDevices: { getUserMedia, enumerateDevices },
  });
  return { getUserMedia, tracks };
}

function renderScanner() {
  return renderHook(() => useQrScanner({ onDetect: () => {}, paused: false }));
}

beforeEach(() => {
  // jsdom에는 canvas 2D가 없어 경고가 난다. 이 테스트는 판독을 보지 않으므로 비워 둔다.
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useQrScanner 카메라 전환", () => {
  it("처음에는 뒤 카메라를 켜고 화면을 뒤집지 않는다", async () => {
    const { getUserMedia } = stubCameras(2);
    const { result } = renderScanner();

    await act(async () => {});

    expect(getUserMedia).toHaveBeenCalledWith({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });
    expect(result.current.status).toBe("scanning");
    expect(result.current.mirrored).toBe(false);
  });

  it("카메라가 둘 이상이면 전환할 수 있다", async () => {
    stubCameras(2);
    const { result } = renderScanner();

    await act(async () => {});

    expect(result.current.canSwitch).toBe(true);
  });

  it("카메라가 하나뿐이면 전환할 수 없다", async () => {
    stubCameras(1);
    const { result } = renderScanner();

    await act(async () => {});

    expect(result.current.canSwitch).toBe(false);
  });

  it("전환하면 켜져 있던 카메라를 끄고 앞 카메라를 켜 거울처럼 보인다", async () => {
    const { getUserMedia, tracks } = stubCameras(2);
    const { result } = renderScanner();
    await act(async () => {});

    await act(async () => {
      result.current.switchCamera();
    });

    expect(tracks[0].stop).toHaveBeenCalled();
    expect(getUserMedia).toHaveBeenLastCalledWith({
      video: { facingMode: { ideal: "user" } },
      audio: false,
    });
    expect(result.current.status).toBe("scanning");
    expect(result.current.mirrored).toBe(true);
  });

  it("한 번 더 전환하면 뒤 카메라로 돌아온다", async () => {
    const { getUserMedia } = stubCameras(2);
    const { result } = renderScanner();
    await act(async () => {});

    await act(async () => {
      result.current.switchCamera();
    });
    await act(async () => {
      result.current.switchCamera();
    });

    expect(getUserMedia).toHaveBeenLastCalledWith({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });
    expect(result.current.mirrored).toBe(false);
  });

  it("바꾼 카메라를 켜지 못하면 오류 상태가 된다", async () => {
    const { getUserMedia } = stubCameras(2);
    const { result } = renderScanner();
    await act(async () => {});
    getUserMedia.mockRejectedValueOnce(new Error("NotReadableError"));

    await act(async () => {
      result.current.switchCamera();
    });

    expect(result.current.status).toBe("error");
  });
});
