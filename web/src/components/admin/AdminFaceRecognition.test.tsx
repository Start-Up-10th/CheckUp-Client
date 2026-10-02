import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { FaceResult } from "@/lib/admin/face-api";
import {
  FaceGatewayProvider,
  type FaceGateway,
} from "@/lib/admin/face-gateway";
import { createMockFaceGateway } from "@/lib/admin/face-mock-gateway";
import { AdminFaceRecognition } from "./AdminFaceRecognition";

const camera = vi.hoisted(() => ({
  status: "granted" as "requesting" | "granted" | "error",
  // 실제 useCameraStream처럼 렌더마다 같은 ref를 돌려준다.
  videoRef: { current: {} as HTMLVideoElement },
}));
vi.mock("@/lib/admin/use-camera-stream", () => ({
  useCameraStream: () => ({
    videoRef: camera.videoRef,
    status: camera.status,
  }),
}));
vi.mock("@/lib/admin/capture-frame", () => ({
  captureFrame: async () => new Blob([new Uint8Array([1])]),
}));
vi.mock("@/lib/admin/admin-session", () => ({
  redirectToAdminLogin: vi.fn(),
}));

const STUDENTS = { 101: { studentNumber: 2405, name: "김도현" } };

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

function unknown(attempts: number): FaceResult {
  return {
    trackId: "a",
    status: "UNKNOWN",
    attempts,
    qrRecommended: attempts > 3,
  };
}

function renderWith(
  gateway: FaceGateway,
  ui: ReactNode = <AdminFaceRecognition />,
) {
  return render(
    <FaceGatewayProvider value={gateway}>{ui}</FaceGatewayProvider>,
  );
}

async function tick(ms = 0) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  camera.status = "granted";
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AdminFaceRecognition", () => {
  it("인식 결과가 없으면 최근 인식은 빈 상태다", async () => {
    renderWith(createMockFaceGateway([[]], STUDENTS));
    await tick();

    expect(screen.queryByText("인식 실패")).not.toBeInTheDocument();
  });

  it("성공은 `학번 이름`으로, 실패는 신원 없는 인식 실패로 최근 인식에 쌓는다", async () => {
    renderWith(createMockFaceGateway([[known(101), unknown(1)]], STUDENTS));
    await tick();

    expect(screen.getByText("2405 김도현")).toBeInTheDocument();
    expect(screen.getByText("인식 실패")).toBeInTheDocument();
  });

  it("서버가 QR을 권하면 안내 문구를 보여 주고 시간이 지나면 사라진다", async () => {
    const gateway = createMockFaceGateway([[]], STUDENTS);
    vi.spyOn(gateway, "sendFrame")
      .mockResolvedValueOnce({ frameId: "f", faces: [unknown(4)] })
      .mockResolvedValue({ frameId: "f", faces: [] });
    renderWith(gateway);
    await tick();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "인식 실패 · 3회 초과 시 QR로 출석",
    );

    await tick(10_000);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("실패가 3회 이하이면 QR 안내를 하지 않는다", async () => {
    renderWith(createMockFaceGateway([[unknown(3)]], STUDENTS));
    await tick();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("카메라 허용 전에는 서버에 세션을 만들지 않는다", async () => {
    camera.status = "requesting";
    const gateway = createMockFaceGateway([[]], STUDENTS);
    const createSession = vi.spyOn(gateway, "createSession");

    renderWith(gateway);
    await tick();

    expect(createSession).not.toHaveBeenCalled();
  });

  it("용도 탭을 바꾸면 새 용도로 새 세션을 만들고 이전 기록은 비운다", async () => {
    const gateway = createMockFaceGateway([[known(101)]], STUDENTS);
    const createSession = vi.spyOn(gateway, "createSession");
    const closeSession = vi.spyOn(gateway, "closeSession");
    renderWith(gateway);
    await tick();
    expect(createSession).toHaveBeenLastCalledWith("dorm");

    fireEvent.click(screen.getByRole("button", { name: "자습실" }));
    await tick();

    expect(closeSession).toHaveBeenCalledTimes(1);
    expect(createSession).toHaveBeenLastCalledWith("study");
    expect(screen.getAllByText("2405 김도현")).toHaveLength(1);
  });

  it("세션을 만들지 못하면 최근 인식에 오류와 다시 시도를 보여 준다", async () => {
    const gateway = createMockFaceGateway([[]], STUDENTS);
    vi.spyOn(gateway, "createSession")
      .mockRejectedValueOnce(new Error("server"))
      .mockResolvedValue("ok");
    renderWith(gateway);
    await tick();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    await tick();

    expect(screen.queryByRole("button", { name: "다시 시도" })).toBeNull();
  });

  it("화면을 떠나면 세션을 종료한다", async () => {
    const gateway = createMockFaceGateway([[]], STUDENTS);
    const closeSession = vi.spyOn(gateway, "closeSession");
    const { unmount } = renderWith(gateway);
    await tick();

    unmount();

    expect(closeSession).toHaveBeenCalledTimes(1);
  });
});
