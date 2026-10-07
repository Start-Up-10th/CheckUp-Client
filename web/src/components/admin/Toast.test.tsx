import { act, fireEvent, render, screen } from "@testing-library/react";
import { TOAST_EXIT_MS, ToastLayer, useToast } from "./Toast";

const toast = { variant: "success", message: "저장했습니다." } as const;

function stackOf() {
  return document.querySelector("[data-toast-stack]") as HTMLElement;
}

function layerOf() {
  return screen.getByText("저장했습니다.").closest(".fixed") as HTMLElement;
}

describe("ToastLayer 위치", () => {
  it("핸드폰·패드·컴퓨터 모두 위쪽 가운데에 뜬다", () => {
    render(<ToastLayer toast={toast} />);

    expect(layerOf()).toHaveClass(
      "inset-x-[18px]",
      "justify-center",
      "md:top-[calc(env(safe-area-inset-top)+20px)]",
      "xl:top-[calc(env(safe-area-inset-top)+24px)]",
    );
    expect(layerOf().className).toContain(
      "top-[calc(env(safe-area-inset-top)+12px)]",
    );
    expect(layerOf()).not.toHaveClass("bottom-[78px]", "md:right-[22px]");
  });

  it("폭은 핸드폰 전체(최대 354), 패드 320, 컴퓨터 400이다", () => {
    render(<ToastLayer toast={toast} />);

    expect(stackOf()).toHaveClass(
      "w-full",
      "max-w-[354px]",
      "md:w-[320px]",
      "xl:w-[400px]",
    );
  });

  it("토스트 바깥은 아래 화면 조작을 막지 않는다", () => {
    render(<ToastLayer toast={toast} />);

    expect(layerOf()).toHaveClass("pointer-events-none");
    expect(stackOf()).toHaveClass("pointer-events-auto");
  });

  it("관리자 토스트는 기본으로 핸드폰 폭에서 글자·여백이 작고 패드 이상은 Figma 크기다", () => {
    render(<ToastLayer toast={toast} />);

    const banner = screen.getByRole("status");
    expect(banner).toHaveClass("px-3", "py-2.5", "md:px-3.5", "md:py-3");
    expect(screen.getByText("저장했습니다.")).toHaveClass(
      "text-xs",
      "md:text-[13px]",
    );
  });

  it("compactOnPhone을 끄면 핸드폰에서도 Figma 크기다", () => {
    render(<ToastLayer toast={toast} compactOnPhone={false} />);

    const banner = screen.getByRole("status");
    expect(banner).toHaveClass("px-3.5", "py-3");
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

describe("ToastLayer 애니메이션", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("나타날 때 위에서 내려오는 애니메이션을 쓰고 동작 줄이기에서는 끈다", () => {
    render(<ToastLayer toast={toast} />);

    expect(screen.getByRole("status").parentElement).toHaveClass(
      "animate-toast-in",
      "motion-reduce:animate-none",
    );
  });

  it("사라질 때 퇴장 애니메이션이 끝날 때까지 남아 있다가 지워진다", () => {
    const { rerender } = render(<ToastLayer toast={toast} />);

    rerender(<ToastLayer toast={null} />);
    expect(screen.getByRole("status").parentElement).toHaveClass(
      "animate-toast-out",
    );

    act(() => vi.advanceTimersByTime(TOAST_EXIT_MS));
    expect(screen.queryByText("저장했습니다.")).not.toBeInTheDocument();
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

describe("토스트 쌓기", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function Stack() {
    const { toasts, showToast } = useToast();
    return (
      <>
        <ToastLayer toasts={toasts} />
        <button
          type="button"
          onClick={() =>
            showToast({ variant: "success", message: "성공 하나" })
          }
        >
          성공
        </button>
        <button
          type="button"
          onClick={() => showToast({ variant: "error", message: "오류 하나" })}
        >
          오류
        </button>
        <button
          type="button"
          onClick={() =>
            showToast({ variant: "neutral", message: `안내 ${Math.random()}` })
          }
        >
          안내
        </button>
      </>
    );
  }
  const press = (name: string) =>
    act(() => screen.getByRole("button", { name }).click());
  const items = () => document.querySelectorAll("[data-toast-item]");

  it("토스트가 있는 동안 새 토스트가 생기면 대체하지 않고 쌓인다", () => {
    render(<Stack />);

    press("성공");
    press("오류");

    expect(items()).toHaveLength(2);
    expect(screen.getByText("성공 하나")).toBeInTheDocument();
    expect(screen.getByText("오류 하나")).toBeInTheDocument();
  });

  it("가장 새 토스트가 맨 앞(위)이다", () => {
    render(<Stack />);

    press("성공");
    press("오류");

    const [front, behind] = Array.from(items()) as HTMLElement[];
    expect(front).toHaveTextContent("오류 하나");
    expect(behind).toHaveTextContent("성공 하나");
    expect(Number(front.style.zIndex)).toBeGreaterThan(
      Number(behind.style.zIndex),
    );
  });

  it("토스트마다 자기 시간이 지나면 따로 사라진다(성공 2초, 오류 4초)", () => {
    render(<Stack />);

    press("오류");
    act(() => vi.advanceTimersByTime(1000));
    press("성공");
    expect(items()).toHaveLength(2);

    // 성공은 1000+2000=3000ms에, 오류는 4000ms에 사라진다(각각 사라지는 애니메이션 200ms 뒤 지워진다).
    act(() => vi.advanceTimersByTime(2000));
    act(() => vi.advanceTimersByTime(TOAST_EXIT_MS));
    expect(screen.queryByText("성공 하나")).not.toBeInTheDocument();
    expect(screen.getByText("오류 하나")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1000));
    act(() => vi.advanceTimersByTime(TOAST_EXIT_MS));
    expect(screen.queryByText("오류 하나")).not.toBeInTheDocument();
  });

  it("같은 문구를 다시 띄우면 하나만 남고 타이머가 새로 시작된다", () => {
    render(<Stack />);

    press("성공");
    act(() => vi.advanceTimersByTime(1500));
    press("성공");

    expect(items()).toHaveLength(1);
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText("성공 하나")).toBeInTheDocument();
  });

  it("최대 5개까지만 쌓고 넘치면 가장 오래된 것부터 지운다", () => {
    render(<Stack />);

    for (let i = 0; i < 7; i += 1) press("안내");
    act(() => vi.advanceTimersByTime(TOAST_EXIT_MS));

    expect(items()).toHaveLength(5);
  });

  it("마우스를 올리면 펼쳐지고 벗어나면 접힌다", () => {
    render(<Stack />);
    press("성공");
    press("오류");
    expect(stackOf()).toHaveAttribute("data-expanded", "false");

    fireEvent.pointerEnter(stackOf(), { pointerType: "mouse" });
    expect(stackOf()).toHaveAttribute("data-expanded", "true");

    fireEvent.pointerLeave(stackOf(), { pointerType: "mouse" });
    expect(stackOf()).toHaveAttribute("data-expanded", "false");
  });

  it("터치 화면은 누르면 펼치고 다시 누르면 접는다", () => {
    render(<Stack />);
    press("성공");
    press("오류");

    fireEvent.pointerDown(stackOf(), { pointerType: "touch" });
    expect(stackOf()).toHaveAttribute("data-expanded", "true");

    fireEvent.pointerDown(stackOf(), { pointerType: "touch" });
    expect(stackOf()).toHaveAttribute("data-expanded", "false");
  });

  it("접힌 상태에서는 뒤 토스트가 작고 흐리게 겹치고 펼치면 모두 원래 크기다", () => {
    render(<Stack />);
    press("성공");
    press("오류");
    const behind = Array.from(items())[1] as HTMLElement;

    expect(behind.style.transform).toContain("scale(0.95)");

    fireEvent.pointerEnter(stackOf(), { pointerType: "mouse" });
    expect(behind.style.transform).toContain("scale(1)");
  });
});

describe("단일 토스트(toast 속성)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("문구가 바뀌면 이전 것이 겹쳐 남지 않고 그 자리에서 바뀐다", () => {
    const { rerender } = render(
      <ToastLayer toast={{ variant: "error", message: "첫째" }} />,
    );

    rerender(<ToastLayer toast={{ variant: "error", message: "둘째" }} />);

    expect(screen.queryByText("첫째")).not.toBeInTheDocument();
    expect(screen.getByText("둘째")).toBeInTheDocument();
    expect(document.querySelectorAll("[data-toast-item]")).toHaveLength(1);
  });
});
