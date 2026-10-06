import { act, render, screen } from "@testing-library/react";
import { usePresence } from "./use-presence";

function Host({ value }: { value: string | null }) {
  const { current, closing } = usePresence(value, 200);
  return <p>{current ? `${current}:${closing ? "out" : "in"}` : "없음"}</p>;
}

describe("usePresence", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("값이 사라져도 퇴장 시간 동안 마지막 값을 closing으로 돌려준다", () => {
    const { rerender } = render(<Host value="a" />);
    expect(screen.getByText("a:in")).toBeInTheDocument();

    rerender(<Host value={null} />);
    expect(screen.getByText("a:out")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(199));
    expect(screen.getByText("a:out")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByText("없음")).toBeInTheDocument();
  });

  it("퇴장 중 새 값이 오면 취소하고 새 값을 보인다", () => {
    const { rerender } = render(<Host value="a" />);
    rerender(<Host value={null} />);
    rerender(<Host value="b" />);

    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByText("b:in")).toBeInTheDocument();
  });

  it("처음부터 값이 없으면 아무것도 보이지 않는다", () => {
    render(<Host value={null} />);

    expect(screen.getByText("없음")).toBeInTheDocument();
  });
});
