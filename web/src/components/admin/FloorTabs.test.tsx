import { render, screen } from "@testing-library/react";
import { FloorTabs } from "./FloorTabs";

describe("FloorTabs", () => {
  it("컴퓨터에서도 회색 트랙 안의 세그먼트다", () => {
    render(<FloorTabs selected={4} onSelect={() => {}} />);

    const track = screen.getByRole("button", { name: "3층" }).parentElement;
    expect(track).toHaveClass("bg-[#e6e6e8]", "xl:p-1.5");
    expect(track).not.toHaveClass("xl:bg-transparent");
  });

  it("선택한 층은 컴퓨터에서도 굵은 글자이고 나머지는 보통 굵기다", () => {
    render(<FloorTabs selected={4} onSelect={() => {}} />);

    expect(screen.getByRole("button", { name: "4층" })).toHaveClass(
      "font-bold",
      "xl:font-bold",
      "bg-admin-attendance-bg",
    );
    expect(screen.getByRole("button", { name: "3층" })).toHaveClass(
      "xl:font-normal",
      "bg-admin-surface",
    );
  });

  it("누르면 그 층을 고른다", () => {
    const onSelect = vi.fn();
    render(<FloorTabs selected={4} onSelect={onSelect} />);

    screen.getByRole("button", { name: "5층" }).click();
    expect(onSelect).toHaveBeenCalledWith(5);
  });
});
