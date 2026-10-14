import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StudentQrCamera } from "@/components/student/StudentQrCamera";

const mocks = vi.hoisted(() => ({
  useQrScanner: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/qr",
}));
vi.mock("@/lib/student/use-qr-scanner", () => ({
  useQrScanner: mocks.useQrScanner,
}));
vi.mock("@/components/student/StudentShell", () => ({
  StudentShell: ({ children }: { children: React.ReactNode }) => children,
}));

function setViewport(matches: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
}

describe("StudentQrCamera", () => {
  beforeEach(() => {
    mocks.useQrScanner.mockReset();
    mocks.useQrScanner.mockReturnValue({
      videoRef: { current: null },
      status: "idle",
      canSwitch: false,
      mirrored: false,
      switchCamera: vi.fn(),
    });
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("노트북 폭(1280px 이상)이면 카메라를 켜지 않고 핸드폰으로 출석하라고 안내한다", () => {
    setViewport(true);
    render(<StudentQrCamera />);

    expect(
      screen.getByRole("heading", { name: "핸드폰으로 QR 출석을 해주세요" }),
    ).toBeInTheDocument();
    expect(mocks.useQrScanner).toHaveBeenLastCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });

  it("핸드폰·패드 폭이면 카메라를 켠다", () => {
    setViewport(false);
    render(<StudentQrCamera />);

    expect(mocks.useQrScanner).toHaveBeenLastCalledWith(
      expect.objectContaining({ enabled: true }),
    );
  });
});
