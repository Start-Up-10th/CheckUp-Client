/**
 * 서버가 받는 영상 형식(`video/webm`·`video/mp4`) 중 이 브라우저가 녹화할 수 있는 것을 앞에서부터 고른다.
 * 안드로이드 크롬은 webm, 아이폰 사파리는 mp4를 쓴다.
 */
const FACE_VIDEO_TYPES = ["video/webm", "video/mp4"];

export type FaceRecording = {
  /** 녹화를 끝내고 영상을 돌려준다. 영상은 메모리에만 있고, 받은 쪽이 쓰고 나서 버린다. */
  finish: () => Promise<Blob>;
  /** 녹화를 그만두고 지금까지 모은 영상을 버린다. 여러 번 불러도 된다. */
  discard: () => void;
};

/** 이 브라우저가 녹화할 수 있는 영상 형식. 녹화를 지원하지 않으면 null이다. */
export function pickFaceVideoType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  return (
    FACE_VIDEO_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? null
  );
}

/**
 * REQ-FACE-001·002: 얼굴 등록 `촬영 중` 단계 동안 카메라 영상을 녹화한다. 서버가 영상 하나를 받아
 * 프레임 추출·품질 평가를 하므로(`POST /api/v1/face/enrollments`) 웹은 프레임을 따로 뽑지 않는다.
 * 영상 조각은 이 함수 안의 메모리에만 모으고 디스크·저장소·로그에 남기지 않는다. `finish`로 넘기거나
 * `discard`로 버리면 조각을 바로 비운다. 녹화를 지원하지 않는 브라우저면 null을 돌려준다.
 */
export function startFaceRecording(stream: MediaStream): FaceRecording | null {
  const mimeType = pickFaceVideoType();
  if (!mimeType) return null;

  const recorder = new MediaRecorder(stream, { mimeType });
  let chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };
  recorder.start();

  const discard = () => {
    recorder.ondataavailable = null;
    recorder.onstop = null;
    recorder.onerror = null;
    if (recorder.state !== "inactive") recorder.stop();
    chunks = [];
  };

  const finish = () =>
    new Promise<Blob>((resolve, reject) => {
      if (recorder.state === "inactive") {
        reject(new Error("faceRecording: not recording"));
        return;
      }
      recorder.onstop = () => {
        const video = new Blob(chunks, { type: mimeType });
        chunks = [];
        if (video.size === 0) reject(new Error("faceRecording: empty"));
        else resolve(video);
      };
      recorder.onerror = () => {
        discard();
        reject(new Error("faceRecording: failed"));
      };
      recorder.stop();
    });

  return { finish, discard };
}
