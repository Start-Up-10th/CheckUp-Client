import { render, screen } from "@testing-library/react";
import { CameraPanel } from "./CameraPanel";

function renderPanel(props: {
  isFullscreen: boolean;
  successMessage?: string | null;
  failureMessage?: string | null;
  status?: "requesting" | "granted" | "error";
}) {
  return render(
    <CameraPanel
      videoRef={{ current: null }}
      onEnterFullscreen={() => {}}
      onExitFullscreen={() => {}}
      {...{ status: "granted", ...props }}
    />,
  );
}

describe("CameraPanel 전체화면 문구", () => {
  it("성공 문구가 없으면 인식 대기 안내를 보여 준다", () => {
    renderPanel({ isFullscreen: true });

    expect(screen.getByText("인식 대기 중")).toBeInTheDocument();
    expect(
      screen.getByText("가이드 안에 얼굴을 맞춰 주세요"),
    ).toBeInTheDocument();
  });

  it("성공 문구가 있으면 대기 안내를 대신한다", () => {
    renderPanel({ isFullscreen: true, successMessage: "성공 · 2405 김도현" });

    expect(screen.getByText("성공 · 2405 김도현")).toBeInTheDocument();
    expect(screen.queryByText("인식 대기 중")).not.toBeInTheDocument();
    expect(
      screen.queryByText("가이드 안에 얼굴을 맞춰 주세요"),
    ).not.toBeInTheDocument();
  });

  it("일반 화면에는 대기 문구를 그리지 않는다(Figma 일반 화면은 비어 있다)", () => {
    renderPanel({ isFullscreen: false });

    expect(screen.queryByText("인식 대기 중")).not.toBeInTheDocument();
  });
});

describe("CameraPanel 하단 성공·실패 배너", () => {
  it("일반 화면에서 성공 문구를 성공 배너로 보인다", () => {
    renderPanel({ isFullscreen: false, successMessage: "성공 · 2405 김도현" });

    expect(screen.getByRole("status")).toHaveTextContent("성공 · 2405 김도현");
  });

  it("실패 문구를 실패 배너로 보인다", () => {
    renderPanel({ isFullscreen: false, failureMessage: "인식 실패" });

    expect(screen.getByRole("alert")).toHaveTextContent("인식 실패");
  });

  it("전체화면에서는 성공을 배너가 아니라 큰 문구로, 실패는 배너로 보인다", () => {
    renderPanel({
      isFullscreen: true,
      successMessage: "성공 · 2405 김도현",
      failureMessage: "인식 실패",
    });

    expect(screen.getByText("성공 · 2405 김도현")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("인식 실패");
  });

  it("카메라를 실행하지 못했으면 배너를 보이지 않는다", () => {
    renderPanel({
      isFullscreen: false,
      status: "error",
      failureMessage: "인식 실패",
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.getByText("카메라를 자동으로 실행하지 못했습니다."),
    ).toBeInTheDocument();
  });
});
