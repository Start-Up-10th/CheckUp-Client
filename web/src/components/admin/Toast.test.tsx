import { render, screen } from "@testing-library/react";
import { ToastLayer } from "./Toast";

const toast = { variant: "success", message: "저장했습니다." } as const;

function layerOf() {
  return screen.getByText("저장했습니다.").closest(".fixed") as HTMLElement;
}

describe("ToastLayer 위치", () => {
  it("기본은 컴퓨터에서 하단 중앙이다", () => {
    render(<ToastLayer toast={toast} />);

    expect(layerOf()).toHaveClass("xl:bottom-7", "xl:justify-center");
    expect(layerOf()).not.toHaveClass("xl:top-7");
  });

  it("top-right는 컴퓨터에서 오른쪽 위로 옮기고 패드·폰 위치는 그대로다", () => {
    render(<ToastLayer toast={toast} placement="top-right" />);

    expect(layerOf()).toHaveClass("xl:top-7", "xl:justify-end", "xl:pr-8");
    expect(layerOf()).not.toHaveClass("xl:bottom-7");
    expect(layerOf()).toHaveClass(
      "bottom-[78px]",
      "md:top-7",
      "md:justify-end",
    );
  });

  it("below-tabs는 컴퓨터에서 층 탭 아래(91px) 오른쪽이다", () => {
    render(<ToastLayer toast={toast} placement="below-tabs" />);

    expect(layerOf()).toHaveClass("xl:top-[91px]", "xl:justify-end", "xl:pr-8");
    expect(layerOf()).not.toHaveClass("xl:top-7");
    expect(layerOf()).not.toHaveClass("xl:bottom-7");
  });

  it("variantBorder를 배너에 전달한다", () => {
    render(<ToastLayer toast={toast} variantBorder />);

    expect(screen.getByRole("status")).toHaveClass(
      "border-admin-attendance-border",
    );
  });

  it("토스트가 없으면 아무것도 그리지 않는다", () => {
    const { container } = render(<ToastLayer toast={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});
