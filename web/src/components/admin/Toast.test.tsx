import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { toast as notify } from "react-toastify";
import { ToastLayer, useToast, type ToastMessage } from "./Toast";

function Stack() {
  const { showToast } = useToast();
  const show = (toast: ToastMessage) => () => showToast(toast);
  return (
    <>
      <ToastLayer />
      <button onClick={show({ variant: "success", message: "성공 하나" })}>
        성공
      </button>
      <button onClick={show({ variant: "error", message: "오류 하나" })}>
        오류
      </button>
      <button onClick={show({ variant: "neutral", message: "안내 하나" })}>
        안내
      </button>
    </>
  );
}

const press = (name: string) =>
  act(async () => screen.getByRole("button", { name }).click());

const messages = () =>
  Array.from(document.querySelectorAll(".Toastify__toast")).map(
    (toast) => toast.textContent,
  );

// 포커스를 잃은 창에서는 라이브러리가 시간을 멈춘다. jsdom은 포커스가 없다고 답해서 있다고 돌려준다.
beforeEach(() => {
  vi.spyOn(document, "hasFocus").mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("토스트 쌓기", () => {
  it("토스트가 있는 동안 새 토스트가 생기면 대체하지 않고 쌓인다", async () => {
    render(<Stack />);

    await press("성공");
    await press("오류");

    expect(messages()).toHaveLength(2);
    expect(screen.getByText("성공 하나")).toBeInTheDocument();
    expect(screen.getByText("오류 하나")).toBeInTheDocument();
  });

  it("같은 문구를 다시 띄우면 하나만 남는다", async () => {
    render(<Stack />);

    await press("성공");
    await press("성공");

    expect(messages()).toHaveLength(1);
  });

  it("쌓은 토스트는 위쪽 가운데에 쌓는 묶음(stacked) 안에 있다", async () => {
    render(<Stack />);

    await press("성공");

    const container = document.querySelector(".Toastify__toast-container");
    expect(container).toHaveClass("Toastify__toast-container--top-center");
    expect(container).toHaveAttribute("data-stacked", "true");
  });

  it("종류마다 알맞은 토스트다(성공·오류·안내)", async () => {
    render(<Stack />);

    await press("성공");
    await press("오류");
    await press("안내");

    expect(document.querySelector(".Toastify__toast--success")).not.toBeNull();
    expect(document.querySelector(".Toastify__toast--error")).not.toBeNull();
    expect(document.querySelector(".Toastify__toast--info")).not.toBeNull();
  });

  it("한 토스트가 닫혀도 나머지는 그대로 남는다(각자 따로 닫힌다)", async () => {
    render(<Stack />);
    await press("성공");
    await press("오류");

    await act(async () => notify.dismiss("success:성공 하나"));

    expect(screen.queryByText("성공 하나")).not.toBeInTheDocument();
    expect(screen.getByText("오류 하나")).toBeInTheDocument();
    expect(messages()).toHaveLength(1);
  });

  it("최대 5개까지만 보인다", async () => {
    function Many() {
      const { showToast } = useToast();
      return (
        <>
          <ToastLayer />
          <button
            onClick={() => {
              for (let i = 0; i < 8; i += 1) {
                showToast({ variant: "neutral", message: `안내 ${i}` });
              }
            }}
          >
            많이
          </button>
        </>
      );
    }
    render(<Many />);

    await press("많이");

    expect(messages().length).toBeLessThanOrEqual(5);
  });
});

describe("표시 시간", () => {
  it.each([
    ["성공", 2000],
    ["안내", 2000],
    ["오류", 4000],
  ])("%s 토스트의 진행 시간은 %dms다", async (name, ms) => {
    render(<Stack />);

    await press(name);

    const bar = screen.getByRole("progressbar");
    expect(bar.style.animationDuration).toBe(`${ms}ms`);
  });
});

describe("단일 토스트(toast 속성)", () => {
  it("보였다가 null이 되면 닫힌다", async () => {
    const { rerender } = render(
      <ToastLayer toast={{ variant: "error", message: "상태 오류" }} />,
    );
    expect(await screen.findByText("상태 오류")).toBeInTheDocument();

    await act(async () => rerender(<ToastLayer toast={null} />));

    expect(screen.queryByText("상태 오류")).not.toBeInTheDocument();
  });

  it("문구가 바뀌면 겹쳐 쌓이지 않고 그 자리에서 바뀐다", async () => {
    const { rerender } = render(
      <ToastLayer toast={{ variant: "error", message: "첫째" }} />,
    );
    expect(await screen.findByText("첫째")).toBeInTheDocument();

    await act(async () =>
      rerender(<ToastLayer toast={{ variant: "error", message: "둘째" }} />),
    );

    // 갱신은 라이브러리 안에서 한 박자 뒤에 반영된다.
    expect(await screen.findByText("둘째")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText("첫째")).not.toBeInTheDocument(),
    );
    expect(messages()).toHaveLength(1);
  });

  it("자동으로 닫히지 않는다(상태가 풀릴 때까지 유지)", async () => {
    render(<ToastLayer toast={{ variant: "error", message: "계속" }} />);
    await screen.findByText("계속");

    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("화면을 떠나면 이 화면의 토스트가 사라진다", async () => {
    const { unmount } = render(
      <ToastLayer toast={{ variant: "error", message: "떠날 때" }} />,
    );
    await screen.findByText("떠날 때");

    unmount();
    render(<ToastLayer />);

    expect(screen.queryByText("떠날 때")).not.toBeInTheDocument();
  });

  it("글자 버튼을 붙이면 누를 때 그 동작을 부른다", async () => {
    const onClick = vi.fn();
    render(
      <ToastLayer
        toast={{
          variant: "error",
          message: "불러오지 못했어요",
          action: { label: "다시 시도", onClick },
        }}
      />,
    );

    const button = await screen.findByRole("button", { name: "다시 시도" });
    await act(async () => button.click());

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByText("불러오지 못했어요")).toBeInTheDocument();
  });
});
