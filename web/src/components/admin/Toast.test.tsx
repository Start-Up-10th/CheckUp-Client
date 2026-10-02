import { render, screen } from "@testing-library/react";
import { ToastLayer } from "./Toast";

const toast = { variant: "success", message: "저장했습니다." } as const;

function layerOf() {
  return screen.getByText("저장했습니다.").closest(".fixed") as HTMLElement;
}

describe("ToastLayer 위치", () => {
  it("기본은 컴퓨터에서 하단 중앙, 패드는 오른쪽 위, 폰은 탭바 위다", () => {
    render(<ToastLayer toast={toast} />);

    expect(layerOf()).toHaveClass(
      "xl:bottom-7",
      "xl:justify-center",
      "md:top-7",
      "bottom-[78px]",
    );
  });

  it("positionClassName을 주면 기본 위치 대신 그 위치만 쓴다", () => {
    render(
      <ToastLayer
        toast={toast}
        positionClassName="inset-x-4 top-[63px] md:top-[79px] xl:top-[91px]"
      />,
    );

    expect(layerOf()).toHaveClass(
      "top-[63px]",
      "md:top-[79px]",
      "xl:top-[91px]",
    );
    expect(layerOf()).not.toHaveClass("bottom-[78px]");
    expect(layerOf()).not.toHaveClass("xl:bottom-7");
  });

  it("관리자 토스트는 기본으로 핸드폰 폭에서 작은 크기이고 패드 이상은 Figma 크기다", () => {
    render(<ToastLayer toast={toast} />);

    const banner = screen.getByRole("status");
    expect(banner).toHaveClass("px-3", "py-2.5", "md:px-3.5", "md:py-3");
    expect(screen.getByText("저장했습니다.")).toHaveClass(
      "text-xs",
      "md:text-[13px]",
    );
    expect(banner.parentElement).toHaveClass("w-fit", "md:w-full");
  });

  it("compactOnPhone을 끄면 핸드폰에서도 Figma 크기와 전체 폭이다", () => {
    render(<ToastLayer toast={toast} compactOnPhone={false} />);

    const banner = screen.getByRole("status");
    expect(banner).toHaveClass("px-3.5", "py-3");
    expect(banner.parentElement).toHaveClass("w-full");
    expect(banner.parentElement).not.toHaveClass("w-fit");
  });

  it("토스트 종류에 맞는 테두리를 쓴다", () => {
    render(<ToastLayer toast={toast} />);

    expect(screen.getByRole("status")).toHaveClass(
      "border-admin-attendance-border",
    );
  });

  it("토스트가 없으면 아무것도 그리지 않는다", () => {
    const { container } = render(<ToastLayer toast={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
