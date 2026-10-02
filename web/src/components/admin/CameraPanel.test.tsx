import { render, screen } from "@testing-library/react";
import { CameraPanel } from "./CameraPanel";

function renderPanel(props: {
  isFullscreen: boolean;
  successMessage?: string | null;
}) {
  return render(
    <CameraPanel
      videoRef={{ current: null }}
      status="granted"
      onEnterFullscreen={() => {}}
      onExitFullscreen={() => {}}
      {...props}
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

  it("일반 화면에는 대기·성공 문구를 그리지 않는다(Figma 일반 화면은 비어 있다)", () => {
    renderPanel({ isFullscreen: false, successMessage: "성공 · 2405 김도현" });

    expect(screen.queryByText("성공 · 2405 김도현")).not.toBeInTheDocument();
    expect(screen.queryByText("인식 대기 중")).not.toBeInTheDocument();
  });
});
