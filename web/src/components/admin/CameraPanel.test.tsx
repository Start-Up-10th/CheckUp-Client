import { fireEvent, render, screen } from "@testing-library/react";
import { CameraPanel } from "./CameraPanel";

function renderPanel(props: {
  successMessage?: string | null;
  failureMessage?: string | null;
  status?: "requesting" | "granted" | "error";
  recognitionFailed?: boolean;
  onRetry?: () => void;
}) {
  return render(
    <CameraPanel
      videoRef={{ current: null }}
      {...{ status: "granted", ...props }}
    />,
  );
}

describe("CameraPanel", () => {
  it("카메라 화면 라벨과 LIVE를 보이고 전체화면 버튼은 없다", () => {
    renderPanel({});

    expect(screen.getByText("카메라 화면")).toBeInTheDocument();
    expect(screen.getByText("LIVE")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "전체화면으로 보기" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("인식 대기 중")).not.toBeInTheDocument();
  });

  it("카메라 허용 전에는 LIVE를 보이지 않는다", () => {
    renderPanel({ status: "requesting" });

    expect(screen.queryByText("LIVE")).not.toBeInTheDocument();
  });
});

describe("CameraPanel 하단 성공·실패 배너", () => {
  it("성공 문구를 성공 배너로 보인다", () => {
    renderPanel({ successMessage: "성공 · 2405 김도현" });

    expect(screen.getByRole("status")).toHaveTextContent("성공 · 2405 김도현");
  });

  it("실패 문구를 실패 배너로 보인다", () => {
    renderPanel({ failureMessage: "인식 실패" });

    expect(screen.getByRole("alert")).toHaveTextContent("인식 실패");
  });

  it("카메라를 실행하지 못했으면 배너를 보이지 않고 실행 실패 문구를 보인다", () => {
    renderPanel({ status: "error", failureMessage: "인식 실패" });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.getByText("카메라를 자동으로 실행하지 못했습니다."),
    ).toBeInTheDocument();
  });
});

describe("CameraPanel 인식 서버 오류", () => {
  it("인식 서버에 연결하지 못하면 오류 배너와 다시 시도를 보인다", () => {
    const onRetry = vi.fn();
    renderPanel({ recognitionFailed: true, onRetry });

    expect(screen.getByText("불러오지 못했어요")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
