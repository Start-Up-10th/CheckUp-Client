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

function known(): FaceResult {
  return {
    trackId: "k2405",
    status: "KNOWN",
    studentName: "김도현",
    studentNumber: 2405,
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
  it("인식 결과가 없으면 성공·실패 표시를 하지 않는다", async () => {
    renderWith(createMockFaceGateway([[]]));
    await tick();

    expect(screen.queryByText("인식 실패")).not.toBeInTheDocument();
  });

  it("성공은 `학번 이름`으로, 실패는 신원 없는 인식 실패로 카메라 하단에 보인다", async () => {
    renderWith(createMockFaceGateway([[known(), unknown(1)]]));
    await tick();

    expect(screen.getByRole("status")).toHaveTextContent("성공 · 2405 김도현");
    expect(screen.getByRole("alert")).toHaveTextContent("인식 실패");
  });

  it("용도 탭·전체화면 버튼·최근 인식 목록은 없다", async () => {
    renderWith(createMockFaceGateway([[known()]]));
    await tick();

    expect(screen.queryByRole("button", { name: "자습실" })).toBeNull();
    expect(screen.queryByRole("button", { name: "기숙사" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "전체화면으로 보기" }),
    ).toBeNull();
    expect(screen.queryByText("최근 인식")).toBeNull();
  });

  it("서버가 QR을 권하면 안내 문구를 보여 주고 시간이 지나면 사라진다", async () => {
    const gateway = createMockFaceGateway([[]]);
    vi.spyOn(gateway, "sendFrame")
      .mockResolvedValueOnce({ frameId: "f", faces: [unknown(4)] })
      .mockResolvedValue({ frameId: "f", faces: [] });
    renderWith(gateway);
    await tick();

    expect(
      screen.getByText("인식 실패 · 3회 초과 시 QR로 출석"),
    ).toBeInTheDocument();

    await tick(10_000);
    expect(
      screen.queryByText("인식 실패 · 3회 초과 시 QR로 출석"),
    ).not.toBeInTheDocument();
  });

  it("실패가 3회 이하이면 QR 안내를 하지 않는다", async () => {
    renderWith(createMockFaceGateway([[unknown(3)]]));
    await tick();

    expect(
      screen.queryByText("인식 실패 · 3회 초과 시 QR로 출석"),
    ).not.toBeInTheDocument();
  });

  it("실패하면 카메라 하단에 인식 실패 배너를 잠깐 보이고 사라진다", async () => {
    const gateway = createMockFaceGateway([[]]);
    vi.spyOn(gateway, "sendFrame")
      .mockResolvedValueOnce({ frameId: "f", faces: [unknown(1)] })
      .mockResolvedValue({ frameId: "f", faces: [] });
    renderWith(gateway);
    await tick();

    expect(screen.getByRole("alert")).toHaveTextContent("인식 실패");

    await tick(5_000);
    expect(screen.queryByText("인식 실패")).not.toBeInTheDocument();
  });

  it("성공하면 카메라 하단에 `성공 · 학번 이름` 배너를 잠깐 보인다", async () => {
    const gateway = createMockFaceGateway([[]]);
    vi.spyOn(gateway, "sendFrame")
      .mockResolvedValueOnce({ frameId: "f", faces: [known()] })
      .mockResolvedValue({ frameId: "f", faces: [] });
    renderWith(gateway);
    await tick();

    // 배너(화면 읽기용)와 컴퓨터용 칩이 같은 문구를 그린다.
    expect(screen.getByRole("status")).toHaveTextContent("성공 · 2405 김도현");

    await tick(5_000);
    expect(screen.queryByText("성공 · 2405 김도현")).not.toBeInTheDocument();
  });

  it("카메라 허용 전에는 서버에 세션을 만들지 않는다", async () => {
    camera.status = "requesting";
    const gateway = createMockFaceGateway([[]]);
    const createSession = vi.spyOn(gateway, "createSession");

    renderWith(gateway);
    await tick();

    expect(createSession).not.toHaveBeenCalled();
  });

  it("기숙사 용도로 세션을 만든다", async () => {
    const gateway = createMockFaceGateway([[]]);
    const createSession = vi.spyOn(gateway, "createSession");
    renderWith(gateway);
    await tick();

    expect(createSession).toHaveBeenCalledTimes(1);
    expect(createSession).toHaveBeenLastCalledWith("dorm");
  });

  it("세션을 만들지 못하면 오류와 다시 시도를 카메라 영역에 보여 준다", async () => {
    const gateway = createMockFaceGateway([[]]);
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
    const gateway = createMockFaceGateway([[]]);
    const closeSession = vi.spyOn(gateway, "closeSession");
    const { unmount } = renderWith(gateway);
    await tick();

    unmount();

    expect(closeSession).toHaveBeenCalledTimes(1);
  });
});
