import { act, renderHook } from "@testing-library/react";
import { useCameraStream } from "./use-camera-stream";

class FakeTrack extends EventTarget {
  muted = false;
  facingMode: string | undefined = undefined;
  getSettings() {
    return { facingMode: this.facingMode };
  }
  readyState: "live" | "ended" = "live";
  stop = vi.fn();
}

function stubCamera(track: FakeTrack) {
  const stream = {
    getVideoTracks: () => [track],
    getTracks: () => [track],
  } as unknown as MediaStream;
  vi.stubGlobal("navigator", {
    ...navigator,
    mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(stream) },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useCameraStream", () => {
  it("영상이 나오면 허용 상태가 된다", async () => {
    stubCamera(new FakeTrack());
    const { result } = renderHook(() => useCameraStream());

    await act(async () => {});

    expect(result.current.status).toBe("granted");
  });

  it("전면·웹캠(facingMode 없음 또는 user)은 거울처럼 보인다", async () => {
    const track = new FakeTrack();
    stubCamera(track);
    const { result } = renderHook(() => useCameraStream());

    await act(async () => {});

    expect(result.current.mirrored).toBe(true);
  });

  it("후면 카메라(environment)는 거울처럼 뒤집지 않는다", async () => {
    const track = new FakeTrack();
    track.facingMode = "environment";
    stubCamera(track);
    const { result } = renderHook(() => useCameraStream());

    await act(async () => {});

    expect(result.current.mirrored).toBe(false);
  });

  it("허용됐지만 영상이 멈춰 있으면 실행 실패로 본다", async () => {
    const track = new FakeTrack();
    track.muted = true;
    stubCamera(track);
    const { result } = renderHook(() => useCameraStream());

    await act(async () => {});

    expect(result.current.status).toBe("error");
  });

  it("영상이 끊기면 실행 실패로 보고 다시 나오면 되돌린다", async () => {
    const track = new FakeTrack();
    stubCamera(track);
    const { result } = renderHook(() => useCameraStream());
    await act(async () => {});

    act(() => {
      track.muted = true;
      track.dispatchEvent(new Event("mute"));
    });
    expect(result.current.status).toBe("error");

    act(() => {
      track.muted = false;
      track.dispatchEvent(new Event("unmute"));
    });
    expect(result.current.status).toBe("granted");
  });

  it("화면을 떠나면 카메라를 끈다", async () => {
    const track = new FakeTrack();
    stubCamera(track);
    const { unmount } = renderHook(() => useCameraStream());
    await act(async () => {});

    unmount();

    expect(track.stop).toHaveBeenCalledTimes(1);
  });
});
