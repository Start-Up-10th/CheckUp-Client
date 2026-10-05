import { act, render, screen } from "@testing-library/react";
import { ToastLayer, useToast } from "./Toast";

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

describe("useToast 표시 시간", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function Host({ variant }: { variant: "success" | "neutral" | "error" }) {
    const { toast, showToast } = useToast();
    return (
      <>
        <button
          type="button"
          onClick={() => showToast({ variant, message: "메시지" })}
        >
          띄우기
        </button>
        {toast ? <p>{toast.message}</p> : null}
      </>
    );
  }

  it.each([
    ["success", 2000],
    ["neutral", 2000],
    ["error", 4000],
  ] as const)("%s 메시지는 %dms 뒤에 사라진다", (variant, duration) => {
    render(<Host variant={variant} />);
    act(() => screen.getByRole("button", { name: "띄우기" }).click());
    expect(screen.getByText("메시지")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(duration - 1));
    expect(screen.getByText("메시지")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText("메시지")).not.toBeInTheDocument();
  });
});
