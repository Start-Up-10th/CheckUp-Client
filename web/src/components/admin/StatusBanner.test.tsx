import { render, screen } from "@testing-library/react";
import { StatusBanner } from "./StatusBanner";

describe("StatusBanner 테두리", () => {
  it("기본은 모든 종류가 분홍 테두리다(기존 관리자 Figma)", () => {
    const { rerender } = render(
      <StatusBanner variant="success" message="성공" />,
    );
    expect(screen.getByRole("status")).toHaveClass(
      "border-admin-danger-border",
    );

    rerender(<StatusBanner variant="neutral" message="안내" />);
    expect(screen.getByRole("status")).toHaveClass(
      "border-admin-danger-border",
    );
  });

  it.each([
    ["success", "border-admin-attendance-border"],
    ["error", "border-admin-danger-border"],
    ["neutral", "border-admin-border"],
  ] as const)(
    "variantBorder면 %s는 종류에 맞는 테두리다",
    (variant, border) => {
      render(<StatusBanner variant={variant} message="문구" variantBorder />);

      const banner = screen.getByText("문구").parentElement as HTMLElement;
      expect(banner).toHaveClass(border);
      if (variant !== "error") {
        expect(banner).not.toHaveClass("border-admin-danger-border");
      }
    },
  );
});
