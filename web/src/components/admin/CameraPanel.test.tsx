import { render, screen } from "@testing-library/react";
import { CameraPanel } from "./CameraPanel";

function renderPanel(props: { status?: "requesting" | "granted" | "error" }) {
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

  it("거울처럼 보이게 하면 화면 표시만 좌우 반전한다", () => {
    const { container } = render(
      <CameraPanel videoRef={{ current: null }} status="granted" mirrored />,
    );

    expect(container.querySelector("video")).toHaveClass("-scale-x-100");
  });

  it("거울 표시가 아니면 반전하지 않는다", () => {
    const { container } = render(
      <CameraPanel videoRef={{ current: null }} status="granted" />,
    );

    expect(container.querySelector("video")).not.toHaveClass("-scale-x-100");
  });

  it("카메라를 실행하지 못했으면 LIVE 없이 실행 실패 문구를 보인다", () => {
    renderPanel({ status: "error" });

    expect(screen.queryByText("LIVE")).not.toBeInTheDocument();
    expect(
      screen.getByText("카메라를 자동으로 실행하지 못했습니다."),
    ).toBeInTheDocument();
  });

  it("인식 결과 메시지는 이 패널이 아니라 토스트로 보인다(패널에 배너가 없다)", () => {
    renderPanel({});

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
