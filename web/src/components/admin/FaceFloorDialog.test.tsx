import { fireEvent, render, screen } from "@testing-library/react";
import { FaceFloorDialog } from "./FaceFloorDialog";

describe("FaceFloorDialog", () => {
  it("층 버튼은 처음에 선택되지 않고 `확인`도 꺼져 있다", () => {
    render(<FaceFloorDialog onSelect={vi.fn()} onCancel={vi.fn()} />);

    for (const name of ["3층", "4층", "5층"]) {
      expect(screen.getByRole("button", { name })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    }
    expect(screen.getByRole("button", { name: "확인" })).toBeDisabled();
  });

  it("층을 누르면 선택만 되고, `확인`을 눌러야 그 층을 알린다", () => {
    const onSelect = vi.fn();
    render(<FaceFloorDialog onSelect={onSelect} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "4층" }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "4층" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "5층" }));
    expect(screen.getByRole("button", { name: "4층" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    fireEvent.click(screen.getByRole("button", { name: "확인" }));

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(5);
  });

  it("취소·Esc·바깥 누르기는 층을 고르지 않고 취소를 알린다", () => {
    const onSelect = vi.fn();
    const onCancel = vi.fn();
    render(<FaceFloorDialog onSelect={onSelect} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("presentation"));

    expect(onCancel).toHaveBeenCalledTimes(3);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
