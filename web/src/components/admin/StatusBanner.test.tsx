import { render, screen } from "@testing-library/react";
import { StatusBanner } from "./StatusBanner";

describe("StatusBanner 테두리", () => {
  it.each([
    ["success", "border-admin-attendance-border"],
    ["error", "border-admin-danger-border"],
    ["neutral", "border-admin-border"],
  ] as const)("%s는 종류에 맞는 테두리다", (variant, border) => {
    render(<StatusBanner variant={variant} message="문구" />);

    const banner = screen.getByText("문구").parentElement as HTMLElement;
    expect(banner).toHaveClass(border);
    if (variant !== "error") {
      expect(banner).not.toHaveClass("border-admin-danger-border");
    }
  });
});

describe("StatusBanner compactOnPhone", () => {
  it("기본은 핸드폰에서도 Figma 크기(글자 13px, 여백 14×12)다", () => {
    render(<StatusBanner variant="success" message="문구" />);

    const banner = screen.getByRole("status");
    expect(banner).toHaveClass("px-3.5", "py-3", "rounded-xl");
    expect(screen.getByText("문구")).toHaveClass("text-[13px]");
  });

  it("켜면 핸드폰 폭에서 글자 12px와 작은 여백·모서리·점을 쓰고 패드 이상은 Figma 크기로 돌아간다", () => {
    render(<StatusBanner variant="neutral" message="문구" compactOnPhone />);

    const banner = screen.getByRole("status");
    expect(banner).toHaveClass(
      "px-3",
      "py-2.5",
      "rounded-[10px]",
      "md:px-3.5",
      "md:py-3",
      "md:rounded-xl",
    );
    expect(screen.getByText("문구")).toHaveClass("text-xs", "md:text-[13px]");
    expect(banner.firstElementChild).toHaveClass("size-1.5", "md:size-[7px]");
  });
});

describe("StatusBanner 아이콘", () => {
  it("성공은 체크 아이콘이고 높이를 늘리지 않는 16px 원이다", () => {
    render(<StatusBanner variant="success" message="문구" />);

    const icon = screen.getByRole("status").firstElementChild as HTMLElement;
    expect(icon).toHaveTextContent("✓");
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveClass("size-4", "bg-admin-attendance-text");
  });

  it.each(["error", "neutral"] as const)("%s는 점 아이콘이다", (variant) => {
    render(<StatusBanner variant={variant} message="문구" />);

    const icon = screen.getByRole(variant === "error" ? "alert" : "status")
      .firstElementChild as HTMLElement;
    expect(icon).toHaveTextContent("");
    expect(icon).toHaveClass("size-[7px]", "rounded-full");
  });
});
