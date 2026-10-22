import { fireEvent, render, screen } from "@testing-library/react";
import { FaceFloorDialog } from "./FaceFloorDialog";

describe("FaceFloorDialog", () => {
  it("3·4·5층 버튼을 보이고 누른 층을 알린다", () => {
    const onSelect = vi.fn();
    render(<FaceFloorDialog onSelect={onSelect} onCancel={vi.fn()} />);

    expect(
      screen.getByRole("dialog", { name: "층을 선택해 주세요" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "4층" }));

    expect(onSelect).toHaveBeenCalledWith(4);
    expect(screen.getByRole("button", { name: "3층" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "5층" })).toBeInTheDocument();
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
