import { FRAME_MAX_WIDTH, captureFrame, frameSize } from "./capture-frame";

function fakeVideo(width: number, height: number, readyState = 4) {
  return { readyState, videoWidth: width, videoHeight: height } as never;
}

function fakeCanvas(blob: Blob | null) {
  const drawImage = vi.fn();
  const toBlob = vi.fn((callback: BlobCallback) => callback(blob));
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn().mockReturnValue({ drawImage }),
    toBlob,
  };
  return { canvas: canvas as unknown as HTMLCanvasElement, drawImage, toBlob };
}

describe("frameSize", () => {
  it("작은 영상은 그대로 둔다", () => {
    expect(frameSize(320, 240)).toEqual({ width: 320, height: 240 });
  });

  it("넓은 영상은 비율을 지켜 가로를 최대 폭으로 줄인다", () => {
    expect(frameSize(1920, 1080)).toEqual({
      width: FRAME_MAX_WIDTH,
      height: 360,
    });
  });
});

describe("captureFrame", () => {
  it("영상이 준비되지 않았으면 null이고 그리지 않는다", async () => {
    const { canvas, drawImage } = fakeCanvas(new Blob());

    await expect(
      captureFrame(fakeVideo(640, 480, 1), canvas),
    ).resolves.toBeNull();
    await expect(captureFrame(fakeVideo(0, 0), canvas)).resolves.toBeNull();

    expect(drawImage).not.toHaveBeenCalled();
  });

  it("줄인 크기로 그려 JPEG Blob을 돌려준다", async () => {
    const jpeg = new Blob([new Uint8Array([1])], { type: "image/jpeg" });
    const { canvas, drawImage, toBlob } = fakeCanvas(jpeg);
    const video = fakeVideo(1280, 720);

    const blob = await captureFrame(video, canvas);

    expect(blob).toBe(jpeg);
    expect(canvas.width).toBe(640);
    expect(canvas.height).toBe(360);
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 640, 360);
    expect(toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      "image/jpeg",
      0.8,
    );
  });

  it("캔버스를 쓸 수 없으면 null이다", async () => {
    const canvas = { getContext: () => null } as unknown as HTMLCanvasElement;

    await expect(captureFrame(fakeVideo(640, 480), canvas)).resolves.toBeNull();
  });
});
