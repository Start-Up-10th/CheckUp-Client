import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminMyPage } from "@/components/admin/AdminMyPage";
import {
  FaceLoginRequiredError,
  FaceNotStudentError,
} from "@/lib/student/face-enroll-api";

const mocks = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn() },
  fetchFaceStatus: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => mocks.router }));
vi.mock("@/lib/student/face-enroll-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/student/face-enroll-api")>()),
  fetchFaceStatus: mocks.fetchFaceStatus,
}));
vi.mock("@/components/admin/Toast", () => ({
  ToastLayer: () => null,
  useToast: () => ({ showToast: mocks.showToast }),
}));

const REGISTERED = { consented: true, eligible: true, enrolled: true };
const NOT_REGISTERED = { consented: false, eligible: true, enrolled: false };

function faceRegisterButton() {
  return screen.getByRole("button", { name: /얼굴 등록/ });
}

describe("AdminMyPage", () => {
  beforeEach(() => {
    mocks.router.push.mockReset();
    mocks.router.replace.mockReset();
    mocks.fetchFaceStatus.mockReset();
    mocks.showToast.mockReset();
  });

  afterEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it("프로필과 얼굴 등록·화면 모드 메뉴를 보여 준다", () => {
    render(<AdminMyPage />);

    expect(screen.getByRole("heading", { name: "관리자" })).toBeInTheDocument();
    expect(screen.getByText("DataGSM 계정으로 로그인됨")).toBeInTheDocument();
    expect(faceRegisterButton()).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "화면 모드" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  describe("얼굴 등록", () => {
    it("아직 등록하지 않았으면 바로 개인정보 동의로 간다(관리자 출발 표시)", async () => {
      mocks.fetchFaceStatus.mockResolvedValue(NOT_REGISTERED);
      render(<AdminMyPage />);

      fireEvent.click(faceRegisterButton());

      await waitFor(() =>
        expect(mocks.router.push).toHaveBeenCalledWith("/consent?from=admin"),
      );
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("이미 등록했으면 이동하지 않고 다시 등록할지 묻는다", async () => {
      mocks.fetchFaceStatus.mockResolvedValue(REGISTERED);
      render(<AdminMyPage />);

      fireEvent.click(faceRegisterButton());

      expect(
        await screen.findByRole("dialog", {
          name: "이미 얼굴이 등록되어 있어요",
        }),
      ).toBeInTheDocument();
      expect(mocks.router.push).not.toHaveBeenCalled();
    });

    it("뒤로가기를 누르면 창만 닫히고 마이페이지에 머문다", async () => {
      mocks.fetchFaceStatus.mockResolvedValue(REGISTERED);
      render(<AdminMyPage />);
      fireEvent.click(faceRegisterButton());
      await screen.findByRole("dialog");

      fireEvent.click(screen.getByRole("button", { name: "뒤로가기" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(mocks.router.push).not.toHaveBeenCalled();
      expect(faceRegisterButton()).toBeInTheDocument();
    });

    it("다음을 누르면 개인정보 동의로 가서 다시 등록한다(다시 등록·관리자 출발 표시)", async () => {
      mocks.fetchFaceStatus.mockResolvedValue(REGISTERED);
      render(<AdminMyPage />);
      fireEvent.click(faceRegisterButton());
      await screen.findByRole("dialog");

      fireEvent.click(screen.getByRole("button", { name: "다음" }));

      expect(mocks.router.push).toHaveBeenCalledWith(
        "/consent?reset=1&from=admin",
      );
    });

    it("학생 정보가 없는 계정이면 이동하지 않고 안내한다", async () => {
      mocks.fetchFaceStatus.mockRejectedValue(new FaceNotStudentError());
      render(<AdminMyPage />);

      fireEvent.click(faceRegisterButton());

      await waitFor(() =>
        expect(mocks.showToast).toHaveBeenCalledWith({
          variant: "error",
          message: "학생 정보가 없는 계정은 얼굴을 등록할 수 없어요.",
        }),
      );
      expect(mocks.router.push).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("로그인이 풀렸으면 관리자 로그인으로 보낸다", async () => {
      mocks.fetchFaceStatus.mockRejectedValue(new FaceLoginRequiredError());
      render(<AdminMyPage />);

      fireEvent.click(faceRegisterButton());

      await waitFor(() =>
        expect(mocks.router.replace).toHaveBeenCalledWith("/admin/login"),
      );
    });

    it("상태를 불러오지 못하면 이동하지 않고 안내한다", async () => {
      mocks.fetchFaceStatus.mockRejectedValue(new Error("network"));
      render(<AdminMyPage />);

      fireEvent.click(faceRegisterButton());

      await waitFor(() =>
        expect(mocks.showToast).toHaveBeenCalledWith({
          variant: "error",
          message:
            "얼굴 등록 상태를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
        }),
      );
      expect(mocks.router.push).not.toHaveBeenCalled();
    });

    it("확인하는 동안 다시 눌러도 한 번만 요청한다", async () => {
      let resolve: (value: unknown) => void = () => {};
      mocks.fetchFaceStatus.mockReturnValue(
        new Promise((r) => {
          resolve = r;
        }),
      );
      render(<AdminMyPage />);

      fireEvent.click(faceRegisterButton());
      fireEvent.click(faceRegisterButton());

      expect(mocks.fetchFaceStatus).toHaveBeenCalledTimes(1);
      resolve(NOT_REGISTERED);
      await waitFor(() => expect(mocks.router.push).toHaveBeenCalledTimes(1));
    });
  });

  it("화면 모드를 바꾸면 저장하고 html에 알린다", () => {
    render(<AdminMyPage />);

    fireEvent.click(screen.getByRole("switch", { name: "화면 모드" }));

    expect(screen.getByRole("switch", { name: "화면 모드" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem("checkup-theme")).toBe("dark");
  });
});
