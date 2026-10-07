import { act, render, screen } from "@testing-library/react";
import { usePresenceList } from "./use-presence-list";

type Item = { id: number; text: string };
const a: Item = { id: 1, text: "a" };
const b: Item = { id: 2, text: "b" };

function Host({ items }: { items: Item[] }) {
  const list = usePresenceList(items, 200);
  return (
    <ul>
      {list.map(({ item, closing }) => (
        <li key={item.id}>{`${item.text}:${closing ? "out" : "in"}`}</li>
      ))}
    </ul>
  );
}

describe("usePresenceList", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("새 항목은 뒤에 붙고 기존 항목은 자리를 지킨다", () => {
    const { rerender } = render(<Host items={[a]} />);

    rerender(<Host items={[a, b]} />);

    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(
      ["a:in", "b:in"],
    );
  });

  it("빠진 항목만 퇴장 시간 동안 closing으로 남았다가 지워진다", () => {
    const { rerender } = render(<Host items={[a, b]} />);

    rerender(<Host items={[b]} />);
    expect(screen.getByText("a:out")).toBeInTheDocument();
    expect(screen.getByText("b:in")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(199));
    expect(screen.getByText("a:out")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText("a:out")).not.toBeInTheDocument();
    expect(screen.getByText("b:in")).toBeInTheDocument();
  });

  it("항목마다 따로 사라진다", () => {
    const { rerender } = render(<Host items={[a, b]} />);

    rerender(<Host items={[b]} />);
    act(() => vi.advanceTimersByTime(300));
    rerender(<Host items={[]} />);

    expect(screen.getByText("b:out")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(200));
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });
});
