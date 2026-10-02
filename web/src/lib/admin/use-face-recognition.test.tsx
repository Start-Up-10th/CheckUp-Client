import { act, renderHook } from "@testing-library/react";
import type { Mocked } from "vitest";
import type { ReactNode } from "react";
import {
  FaceApiError,
  type FaceFrameResult,
  type FaceResult,
} from "./face-api";
import { FaceGatewayProvider, type FaceGateway } from "./face-gateway";
import {
  ERROR_BACKOFF_MS,
  FAILURE_HOLD_MS,
  FRAME_INTERVAL_MS,
  MAX_CONSECUTIVE_FAILURES,
  QR_NOTICE_HOLD_MS,
  RATE_LIMIT_BACKOFF_MS,
  SUCCESS_HOLD_MS,
  useFaceRecognition,
} from "./use-face-recognition";
import { AdminUnauthorizedError } from "./qr-api";
import type { Purpose } from "./purpose";

const redirectToAdminLogin = vi.hoisted(() => vi.fn());
vi.mock("@/lib/admin/admin-session", () => ({ redirectToAdminLogin }));

const FRAME = new Blob([new Uint8Array([1])], { type: "image/jpeg" });
const capture = async () => FRAME;
const captureNothing = async () => null;
const video = { current: {} as HTMLVideoElement };

function known(studentId: number): FaceResult {
  return {
    trackId: `k${studentId}`,
    status: "KNOWN",
    studentId,
    attendance: "RECORDED",
    attempts: 1,
    qrRecommended: false,
  };
}

function frameOf(faces: FaceResult[]): FaceFrameResult {
  return { frameId: "f", faces };
}

function makeGateway(overrides: Partial<FaceGateway> = {}) {
  let sessions = 0;
  const gateway = {
    createSession: vi.fn(async () => `session-${(sessions += 1)}`),
    closeSession: vi.fn(),
    sendFrame: vi.fn<FaceGateway["sendFrame"]>(async () => frameOf([])),
    loadStudents: vi.fn(async () => ({
      101: { studentNumber: 2405, name: "김도현" },
    })),
    ...overrides,
  } as Mocked<FaceGateway>;
  return gateway;
}

function setup(
  gateway: Mocked<FaceGateway>,
  initial: { cameraReady?: boolean; purpose?: Purpose } = {},
) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <FaceGatewayProvider value={gateway}>{children}</FaceGatewayProvider>
  );
  return renderHook(
    (props: { cameraReady: boolean; purpose: Purpose }) =>
      useFaceRecognition({ videoRef: video, capture, ...props }),
    {
      wrapper,
      initialProps: {
        cameraReady: initial.cameraReady ?? true,
        purpose: initial.purpose ?? "dorm",
      },
    },
  );
}

async function tick(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  redirectToAdminLogin.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useFaceRecognition 세션", () => {
  it("카메라 허용 전에는 세션을 만들지 않고 허용되면 만든다", async () => {
    const gateway = makeGateway();
    const { rerender } = setup(gateway, { cameraReady: false });
    await tick();

    expect(gateway.createSession).not.toHaveBeenCalled();

    rerender({ cameraReady: true, purpose: "dorm" });
    await tick();

    expect(gateway.createSession).toHaveBeenCalledWith("dorm");
  });

  it("세션을 만든 뒤 running이 되고 프레임을 보낸다", async () => {
    const gateway = makeGateway();
    const { result } = setup(gateway);
    expect(result.current.status).toBe("starting");

    await tick();

    expect(result.current.status).toBe("running");
    expect(gateway.sendFrame).toHaveBeenCalledWith(
      "session-1",
      FRAME,
      expect.any(String),
    );
  });

  it("화면을 떠나면 그 세션을 종료한다", async () => {
    const gateway = makeGateway();
    const { unmount } = setup(gateway);
    await tick();

    unmount();

    expect(gateway.closeSession).toHaveBeenCalledWith("session-1");
  });

  it("탭을 닫거나 새로고침해도(pagehide) 세션을 종료하고 그 뒤 화면을 내려도 다시 종료하지 않는다", async () => {
    const gateway = makeGateway();
    const { unmount } = setup(gateway);
    await tick();

    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });

    expect(gateway.closeSession).toHaveBeenCalledTimes(1);
    expect(gateway.closeSession).toHaveBeenCalledWith("session-1");

    unmount();

    expect(gateway.closeSession).toHaveBeenCalledTimes(1);
  });

  it("세션이 없을 때의 pagehide는 아무것도 종료하지 않는다", async () => {
    const gateway = makeGateway();
    setup(gateway, { cameraReady: false });
    await tick();

    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });

    expect(gateway.closeSession).not.toHaveBeenCalled();
  });

  it("세션을 만드는 중에 떠나도 그 세션을 종료한다", async () => {
    let resolveSession: (id: string) => void = () => {};
    const gateway = makeGateway({
      createSession: vi.fn(
        () => new Promise<string>((resolve) => (resolveSession = resolve)),
      ),
    });
    const { unmount } = setup(gateway);
    await tick();

    unmount();
    await act(async () => resolveSession("late"));

    expect(gateway.closeSession).toHaveBeenCalledWith("late");
    expect(gateway.sendFrame).not.toHaveBeenCalled();
  });

  it("용도 탭을 바꾸면 이전 세션만 종료하고 새 용도로 새 세션을 만들며 기록을 비운다", async () => {
    const gateway = makeGateway({
      sendFrame: vi.fn(async () => frameOf([known(101)])),
    });
    const { result, rerender } = setup(gateway);
    await tick();
    expect(result.current.entries).toHaveLength(1);

    rerender({ cameraReady: true, purpose: "study" });
    await tick();

    expect(gateway.closeSession).toHaveBeenCalledWith("session-1");
    expect(gateway.createSession).toHaveBeenLastCalledWith("study");
    expect(result.current.entries).toHaveLength(1);
    expect(gateway.sendFrame).toHaveBeenLastCalledWith(
      "session-2",
      FRAME,
      expect.any(String),
    );
  });

  it("세션 생성이 실패하면(422 등) error이고 retry로 다시 만든다", async () => {
    const gateway = makeGateway({
      createSession: vi
        .fn()
        .mockRejectedValueOnce(new FaceApiError(422, "FACE_NO_CANDIDATES"))
        .mockResolvedValue("session-ok"),
    });
    const { result } = setup(gateway);
    await tick();
    expect(result.current.status).toBe("error");

    act(() => result.current.retry());
    await tick();

    expect(result.current.status).toBe("running");
    expect(gateway.createSession).toHaveBeenCalledTimes(2);
  });

  it("401이면 관리자 로그인으로 보낸다", async () => {
    const gateway = makeGateway({
      createSession: vi.fn().mockRejectedValue(new AdminUnauthorizedError()),
    });

    setup(gateway);
    await tick();

    expect(redirectToAdminLogin).toHaveBeenCalledTimes(1);
  });
});

describe("useFaceRecognition 프레임 전송", () => {
  it("응답이 오기 전에는 다음 프레임을 보내지 않는다", async () => {
    const gateway = makeGateway({
      sendFrame: vi.fn(() => new Promise<FaceFrameResult>(() => {})),
    });
    setup(gateway);

    await tick(FRAME_INTERVAL_MS * 5);

    expect(gateway.sendFrame).toHaveBeenCalledTimes(1);
  });

  it("응답이 오면 간격을 두고 다음 프레임을 보낸다", async () => {
    const gateway = makeGateway();
    setup(gateway);
    await tick();
    expect(gateway.sendFrame).toHaveBeenCalledTimes(1);

    await tick(FRAME_INTERVAL_MS - 1);
    expect(gateway.sendFrame).toHaveBeenCalledTimes(1);
    await tick(1);
    expect(gateway.sendFrame).toHaveBeenCalledTimes(2);
  });

  it("영상이 아직 준비되지 않아 프레임이 없으면 보내지 않고 기다린다", async () => {
    const gateway = makeGateway();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <FaceGatewayProvider value={gateway}>{children}</FaceGatewayProvider>
    );
    renderHook(
      () =>
        useFaceRecognition({
          videoRef: video,
          cameraReady: true,
          purpose: "dorm",
          capture: captureNothing,
        }),
      { wrapper },
    );

    await tick(FRAME_INTERVAL_MS * 3);

    expect(gateway.sendFrame).not.toHaveBeenCalled();
  });

  it("429면 길게 기다렸다 이어 간다", async () => {
    const gateway = makeGateway({
      sendFrame: vi
        .fn()
        .mockRejectedValueOnce(new FaceApiError(429, "FACE_FRAME_RATE_LIMITED"))
        .mockResolvedValue(frameOf([])),
    });
    setup(gateway);
    await tick();
    expect(gateway.sendFrame).toHaveBeenCalledTimes(1);

    await tick(RATE_LIMIT_BACKOFF_MS - 1);
    expect(gateway.sendFrame).toHaveBeenCalledTimes(1);
    await tick(1);
    expect(gateway.sendFrame).toHaveBeenCalledTimes(2);
  });

  it("404면 새 세션을 만들어 이어 간다", async () => {
    const gateway = makeGateway({
      sendFrame: vi
        .fn()
        .mockRejectedValueOnce(new FaceApiError(404, "FACE_SESSION_NOT_FOUND"))
        .mockResolvedValue(frameOf([])),
    });
    const { result } = setup(gateway);
    await tick(FRAME_INTERVAL_MS);

    expect(gateway.createSession).toHaveBeenCalledTimes(2);
    expect(gateway.sendFrame).toHaveBeenLastCalledWith(
      "session-2",
      FRAME,
      expect.any(String),
    );
    expect(result.current.status).toBe("running");
  });

  it("세션이 계속 사라진다고 해도 무한히 만들지 않고 연속 실패 한도에서 error가 된다", async () => {
    const gateway = makeGateway({
      sendFrame: vi
        .fn()
        .mockRejectedValue(new FaceApiError(404, "FACE_SESSION_NOT_FOUND")),
    });
    const { result } = setup(gateway);

    await tick(FRAME_INTERVAL_MS * MAX_CONSECUTIVE_FAILURES * 2);

    expect(result.current.status).toBe("error");
    expect(gateway.createSession).toHaveBeenCalledTimes(
      MAX_CONSECUTIVE_FAILURES,
    );
  });

  it("세션 없음이 아닌 404(라우트 없음 등)는 세션을 다시 만들지 않고 일반 실패로 센다", async () => {
    const gateway = makeGateway({
      sendFrame: vi.fn().mockRejectedValue(new FaceApiError(404, null)),
    });
    const { result } = setup(gateway);

    await tick(ERROR_BACKOFF_MS * MAX_CONSECUTIVE_FAILURES);

    expect(gateway.createSession).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("error");
  });

  it("세션을 새로 만들면 이전 세션의 트랙 시도 기록을 버려 실패 행이 가려지지 않는다", async () => {
    const failFrame = (attempts: number) =>
      frameOf([
        { trackId: "a", status: "UNKNOWN", attempts, qrRecommended: false },
      ]);
    const gateway = makeGateway({
      sendFrame: vi
        .fn()
        .mockResolvedValueOnce(failFrame(3))
        .mockRejectedValueOnce(new FaceApiError(404, "FACE_SESSION_NOT_FOUND"))
        .mockResolvedValue(failFrame(1)),
    });
    const { result } = setup(gateway);

    await tick(FRAME_INTERVAL_MS * 3);

    // 새 세션의 같은 트랙 id가 attempts 1로 시작해도 새 시도로 센다.
    expect(result.current.entries).toHaveLength(2);
  });

  it("연속 실패가 쌓이면 error가 되고 성공하면 횟수를 다시 센다", async () => {
    const gateway = makeGateway({
      sendFrame: vi.fn().mockRejectedValue(new FaceApiError(503, null)),
    });
    const { result } = setup(gateway);

    await tick(ERROR_BACKOFF_MS * MAX_CONSECUTIVE_FAILURES);

    expect(gateway.sendFrame).toHaveBeenCalledTimes(MAX_CONSECUTIVE_FAILURES);
    expect(result.current.status).toBe("error");
  });

  it("중간에 성공이 있으면 실패 횟수를 처음부터 센다", async () => {
    const send = vi.fn();
    for (let i = 0; i < MAX_CONSECUTIVE_FAILURES - 1; i += 1) {
      send.mockRejectedValueOnce(new FaceApiError(503, null));
    }
    send.mockResolvedValueOnce(frameOf([]));
    for (let i = 0; i < MAX_CONSECUTIVE_FAILURES - 1; i += 1) {
      send.mockRejectedValueOnce(new FaceApiError(503, null));
    }
    send.mockResolvedValue(frameOf([]));
    const gateway = makeGateway({ sendFrame: send });
    const { result } = setup(gateway);

    await tick(ERROR_BACKOFF_MS * MAX_CONSECUTIVE_FAILURES * 2);

    expect(result.current.status).toBe("running");
  });

  it("프레임 전송이 401이면 관리자 로그인으로 보낸다", async () => {
    const gateway = makeGateway({
      sendFrame: vi.fn().mockRejectedValue(new AdminUnauthorizedError()),
    });

    setup(gateway);
    await tick();

    expect(redirectToAdminLogin).toHaveBeenCalledTimes(1);
  });
});

describe("useFaceRecognition 결과", () => {
  it("성공은 이름을 붙인 행과 잠깐 보이는 성공 표시를 만든다", async () => {
    const gateway = makeGateway({
      sendFrame: vi.fn(async () => frameOf([known(101)])),
    });
    const { result } = setup(gateway);
    await tick();

    expect(result.current.entries[0]).toMatchObject({
      label: "2405 김도현",
      outcome: "success",
    });
    expect(result.current.success?.label).toBe("2405 김도현");

    await tick(SUCCESS_HOLD_MS);
    expect(result.current.success).toBeNull();
  });

  it("학생 명단을 받지 못해도 인식은 계속하고 이름 없이 인식 성공으로 둔다", async () => {
    const gateway = makeGateway({
      loadStudents: vi.fn().mockRejectedValue(new Error("network")),
      sendFrame: vi.fn(async () => frameOf([known(101)])),
    });
    const { result } = setup(gateway);
    await tick();

    expect(result.current.status).toBe("running");
    expect(result.current.entries[0].label).toBe("인식 성공");
  });

  it("실패하면 잠깐 failure를 켜고 지난 뒤 끈다", async () => {
    const gateway = makeGateway({
      sendFrame: vi
        .fn<FaceGateway["sendFrame"]>()
        .mockResolvedValueOnce(
          frameOf([
            {
              trackId: "a",
              status: "UNKNOWN",
              attempts: 1,
              qrRecommended: false,
            },
          ]),
        )
        .mockResolvedValue(frameOf([])),
    });
    const { result } = setup(gateway);
    await tick();
    expect(result.current.failure).toBe(true);

    await tick(FAILURE_HOLD_MS);

    expect(result.current.failure).toBe(false);
  });

  it("서버가 QR을 권하면 안내를 켜고 일정 시간 뒤 끈다", async () => {
    const gateway = makeGateway({
      sendFrame: vi.fn(async () =>
        frameOf([
          {
            trackId: "a",
            status: "UNKNOWN",
            attempts: 4,
            qrRecommended: true,
          },
        ]),
      ),
    });
    const { result } = setup(gateway);
    await tick();
    expect(result.current.qrNotice).toBe(true);

    gateway.sendFrame.mockResolvedValue(frameOf([]));
    await tick(QR_NOTICE_HOLD_MS);

    expect(result.current.qrNotice).toBe(false);
  });
});
