import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { useModalDialog } from "@/lib/admin/use-modal-dialog";

function Dialog({ onClose }: { onClose: () => void }) {
  const ref = useModalDialog<HTMLDivElement>(onClose);
  return (
    <div ref={ref} tabIndex={-1} role="dialog" aria-label="테스트 창">
      <button type="button">첫째</button>
      <button type="button">둘째</button>
      <button type="button" disabled>
        막힘
      </button>
    </div>
  );
}

function Host({ onClose = () => {} }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <main data-testid="scroller">
      <button type="button" onClick={() => setOpen(true)}>
        열기
      </button>
      {open ? (
        <Dialog
          onClose={() => {
            onClose();
            setOpen(false);
          }}
        />
      ) : null}
    </main>
  );
}

describe("useModalDialog", () => {
  it("열릴 때 패널로 포커스가 가고 Esc로 닫는다", () => {
    const onClose = vi.fn();
    render(<Host onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "열기" }));

    expect(screen.getByRole("dialog")).toHaveFocus();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Tab이 패널 안에서만 돌고 막힌 버튼은 건너뛴다", () => {
    render(<Host />);
    fireEvent.click(screen.getByRole("button", { name: "열기" }));
    const first = screen.getByRole("button", { name: "첫째" });
    const second = screen.getByRole("button", { name: "둘째" });

    second.focus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(first).toHaveFocus();

    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(second).toHaveFocus();
  });

  it("닫히면 열기 전에 포커스가 있던 버튼으로 돌아간다", () => {
    render(<Host />);
    const opener = screen.getByRole("button", { name: "열기" });
    opener.focus();
    fireEvent.click(opener);
    expect(screen.getByRole("dialog")).toHaveFocus();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(opener).toHaveFocus();
  });

  it("열려 있는 동안 main 스크롤을 잠그고 닫으면 되돌린다", () => {
    render(<Host />);
    const scroller = screen.getByTestId("scroller");
    expect(scroller.style.overflowY).toBe("");

    fireEvent.click(screen.getByRole("button", { name: "열기" }));
    expect(scroller.style.overflowY).toBe("hidden");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(scroller.style.overflowY).toBe("");
  });
});
