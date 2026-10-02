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
