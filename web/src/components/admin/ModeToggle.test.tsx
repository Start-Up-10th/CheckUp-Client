import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ModeToggle } from "@/components/admin/ModeToggle";

describe("ModeToggle", () => {
  it("라이트에서는 꺼진 스위치이고 누르면 다크를 알린다", () => {
    const onChange = vi.fn();
    render(<ModeToggle mode="light" onChange={onChange} />);

    const toggle = screen.getByRole("switch", { name: "화면 모드" });
    expect(toggle).toHaveAttribute("aria-checked", "false");

    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith("dark");
  });

  it("다크에서는 켜진 스위치이고 누르면 라이트를 알린다", () => {
    const onChange = vi.fn();
    render(<ModeToggle mode="dark" onChange={onChange} />);

    const toggle = screen.getByRole("switch", { name: "화면 모드" });
    expect(toggle).toHaveAttribute("aria-checked", "true");

    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith("light");
  });
});
