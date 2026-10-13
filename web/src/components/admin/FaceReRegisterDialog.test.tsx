import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FaceReRegisterDialog } from "@/components/admin/FaceReRegisterDialog";

describe("FaceReRegisterDialog", () => {
  it("다시 등록 여부를 묻고 뒤로가기와 다음을 보여 준다", () => {
    render(<FaceReRegisterDialog onBack={() => {}} onNext={() => {}} />);

    expect(
      screen.getByRole("dialog", { name: "이미 얼굴이 등록되어 있어요" }),
    ).toBeInTheDocument();
    expect(screen.getByText("다시 등록하시겠습니까?")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "뒤로가기" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다음" })).toBeInTheDocument();
  });

  it("뒤로가기·Esc·바깥 누르기는 창만 닫고 다음은 부르지 않는다", () => {
    const onBack = vi.fn();
    const onNext = vi.fn();
    const { container } = render(
      <FaceReRegisterDialog onBack={onBack} onNext={onNext} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "뒤로가기" }));
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.click(container.firstElementChild as HTMLElement);

    expect(onBack).toHaveBeenCalledTimes(3);
    expect(onNext).not.toHaveBeenCalled();
  });

  it("다음은 다음만 부른다", () => {
    const onBack = vi.fn();
    const onNext = vi.fn();
    render(<FaceReRegisterDialog onBack={onBack} onNext={onNext} />);

    fireEvent.click(screen.getByRole("button", { name: "다음" }));

    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onBack).not.toHaveBeenCalled();
  });
});
