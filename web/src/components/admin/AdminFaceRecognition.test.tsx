import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import type { FaceResult } from "@/lib/admin/face-api";
import {
  FaceGatewayProvider,
  type FaceGateway,
} from "@/lib/admin/face-gateway";
import { RateLimitedError } from "@/lib/rate-limit";
import { createMockFaceGateway } from "@/lib/admin/face-mock-gateway";
import { AdminFaceRecognition } from "./AdminFaceRecognition";

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

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
  ui: ReactNode = <AdminFaceRecognition initialFloor={3} />,
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

  it("성공은 `학번 이름`으로 최근 인식 목록에 보이고 인식 실패는 남지 않으며 토스트는 없다", async () => {
    renderWith(createMockFaceGateway([[known(), unknown(1)]]));
    await tick();

    const rows = within(screen.getByRole("region", { name: "최근 인식" }))
      .getAllByRole("listitem")
      .map((row) => row.textContent);
    expect(rows).toEqual([
      expect.stringMatching(/^2405 김도현\d\d:\d\d · 성공$/),
    ]);
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("서버가 429로 막으면 잠시 후 다시 시도 안내를 보이고 풀리면 사라진다", async () => {
    const gateway = createMockFaceGateway([[]]);
    vi.spyOn(gateway, "sendFrame")
      .mockRejectedValueOnce(new RateLimitedError(1000))
      .mockResolvedValue({ frameId: "f", faces: [] });
    renderWith(gateway);
    await tick();

    expect(screen.getByText("잠시 후 다시 시도해 주세요.")).toBeInTheDocument();
    expect(screen.queryByText("불러오지 못했어요")).not.toBeInTheDocument();

    await tick(1_500);
    // 사라지는 애니메이션(200ms) 동안은 마지막 토스트를 그린다.
    await tick(300);
    expect(
      screen.queryByText("잠시 후 다시 시도해 주세요."),
    ).not.toBeInTheDocument();
  });

  it("용도 탭·전체화면 버튼은 없다", async () => {
    renderWith(createMockFaceGateway([[known()]]));
    await tick();

    expect(screen.queryByRole("button", { name: "자습실" })).toBeNull();
    expect(screen.queryByRole("button", { name: "기숙사" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "전체화면으로 보기" }),
    ).toBeNull();
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
    // 사라지는 애니메이션(200ms) 동안은 마지막 토스트를 그린다.
    await tick(300);
    expect(
      screen.queryByText("인식 실패 · 3회 초과 시 QR로 출석"),
    ).not.toBeInTheDocument();
  });

  it("실패가 3회 미만이면 QR 안내를 하지 않는다", async () => {
    renderWith(createMockFaceGateway([[unknown(2)]]));
    await tick();

    expect(
      screen.queryByText("인식 실패 · 3회 초과 시 QR로 출석"),
    ).not.toBeInTheDocument();
  });

  it("3회 실패하면 QR 안내 토스트는 뜨고 실패는 목록에 남지 않는다", async () => {
    renderWith(createMockFaceGateway([[unknown(3)]]));
    await tick();

    expect(
      screen.getByText("인식 실패 · 3회 초과 시 QR로 출석"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "최근 인식" })).queryAllByRole(
        "listitem",
      ),
    ).toHaveLength(0);
  });

  it("한 프레임에 6명이 성공해도 모두 목록에 남는다", async () => {
    const faces = Array.from({ length: 6 }, (_, i) => ({
      ...known(),
      trackId: `k${i}`,
      studentNumber: 2401 + i,
    }));
    renderWith(createMockFaceGateway([faces]));
    await tick();

    expect(
      within(screen.getByRole("region", { name: "최근 인식" })).getAllByRole(
        "listitem",
      ),
    ).toHaveLength(6);
  });

  it("이미 출석 처리된 학생을 다시 인식하면 `이미 처리` 행으로 보인다", async () => {
    renderWith(
      createMockFaceGateway([[{ ...known(), attendance: "DUPLICATE" }]]),
    );
    await tick();

    expect(screen.getByRole("listitem")).toHaveTextContent(
      /^2405 김도현\d\d:\d\d · 이미 처리$/,
    );
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
    expect(createSession).toHaveBeenLastCalledWith("dorm", 3);
  });

  it("세션을 만들지 못하면 오류 토스트와 다시 시도를 보여 준다", async () => {
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

  describe("층 선택", () => {
    it("층을 고르기 전에는 카메라 세션을 만들지 않고, 고르면 그 층이 선택된 채 들어간다", async () => {
      const gateway = createMockFaceGateway([[]]);
      const createSession = vi.spyOn(gateway, "createSession");
      renderWith(gateway, <AdminFaceRecognition />);
      await tick();

      expect(
        screen.getByRole("dialog", { name: "층을 선택해 주세요" }),
      ).toBeInTheDocument();
      expect(createSession).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole("button", { name: "5층" }));
      fireEvent.click(screen.getByRole("button", { name: "확인" }));
      await tick();

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "5층" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(createSession).toHaveBeenCalledTimes(1);
    });

    it("들어간 뒤 층 탭으로 층을 바꾸면 이전 세션을 끝내고 그 층으로 새 세션을 만든다", async () => {
      const gateway = createMockFaceGateway([[]]);
      const createSession = vi.spyOn(gateway, "createSession");
      const closeSession = vi.spyOn(gateway, "closeSession");
      renderWith(gateway, <AdminFaceRecognition initialFloor={4} />);
      await tick();

      fireEvent.click(screen.getByRole("button", { name: "3층" }));
      await tick();

      expect(screen.getByRole("button", { name: "3층" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(screen.getByRole("button", { name: "4층" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      expect(createSession).toHaveBeenCalledTimes(2);
      expect(createSession).toHaveBeenNthCalledWith(1, "dorm", 4);
      expect(createSession).toHaveBeenNthCalledWith(2, "dorm", 3);
      expect(closeSession).toHaveBeenCalledWith("mock-session-1");
    });

    it("층 선택 창에서 취소하면 홈으로 돌아간다", () => {
      renderWith(createMockFaceGateway([[]]), <AdminFaceRecognition />);

      fireEvent.click(screen.getByRole("button", { name: "취소" }));

      expect(router.push).toHaveBeenCalledWith("/admin");
    });
  });
});
