/** 서버로 보내는 프레임의 가로 최대 픽셀. 서버 프레임 제한(2MB)보다 훨씬 작게 줄여 업로드를 가볍게 한다. */
export const FRAME_MAX_WIDTH = 640;
const FRAME_QUALITY = 0.8;

type CaptureVideo = Pick<
  HTMLVideoElement,
  "readyState" | "videoWidth" | "videoHeight"
>;

/** 원본 비율을 지키면서 가로가 `maxWidth`를 넘지 않게 줄인 크기. */
export function frameSize(
  width: number,
  height: number,
  maxWidth: number = FRAME_MAX_WIDTH,
): { width: number; height: number } {
  if (width <= maxWidth) return { width, height };
  const scale = maxWidth / width;
  return { width: maxWidth, height: Math.round(height * scale) };
}

/**
 * 카메라 화면에서 한 장을 JPEG로 뜬다. 영상이 아직 준비되지 않았으면 null이다. 프레임은 메모리의 Blob으로만
 * 만들어 서버에 보내고 저장·로그하지 않는다(개인정보 원본 즉시 폐기). 캔버스는 재사용해 장면마다 새로 만들지 않는다.
 */
export function captureFrame(
  video: CaptureVideo & CanvasImageSource,
  canvas: HTMLCanvasElement,
): Promise<Blob | null> {
  if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
    return Promise.resolve(null);
  }
  const { width, height } = frameSize(video.videoWidth, video.videoHeight);
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return Promise.resolve(null);
  context.drawImage(video, 0, 0, width, height);
  return new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", FRAME_QUALITY),
  );
}
