import { AdminUnauthorizedError } from "./qr-api";
import { failureToast } from "./volunteer-action";
import { VolunteerApiError } from "./volunteer-api";

const redirectToAdminLogin = vi.hoisted(() => vi.fn());
vi.mock("@/lib/admin/admin-session", () => ({ redirectToAdminLogin }));

afterEach(() => redirectToAdminLogin.mockReset());

describe("failureToast", () => {
  it("401이면 관리자 로그인으로 보내고 메시지는 없다", () => {
    const onStale = vi.fn();

    const toast = failureToast(new AdminUnauthorizedError(), "실패", onStale);

    expect(toast).toBeNull();
    expect(redirectToAdminLogin).toHaveBeenCalledTimes(1);
    expect(onStale).not.toHaveBeenCalled();
  });

  it.each([
    ["ALREADY_ON_DUTY", "이미 당일 봉사자로 지정된 학생입니다."],
    ["NO_VOLUNTEER_LEFT", "봉사가 없습니다."],
    ["DUTY_ALREADY_COMPLETED", "이미 봉사를 완료했습니다."],
  ])(
    "서버 코드 %s는 안내(neutral)이고 명단을 다시 받게 한다",
    (code, message) => {
      const onStale = vi.fn();

      const toast = failureToast(
        new VolunteerApiError(409, code),
        "실패",
        onStale,
      );

      expect(toast).toEqual({ variant: "neutral", message });
      expect(onStale).toHaveBeenCalledTimes(1);
    },
  );

  it("모르는 서버 코드와 네트워크 오류는 실패 문구(error)다", () => {
    const onStale = vi.fn();

    expect(
      failureToast(new VolunteerApiError(500, null), "실패", onStale),
    ).toEqual({ variant: "error", message: "실패" });
    expect(failureToast(new Error("network"), "실패", onStale)).toEqual({
      variant: "error",
      message: "실패",
    });
    expect(onStale).not.toHaveBeenCalled();
  });

  it("404는 명단을 다시 받게 하되 실패 문구다", () => {
    const onStale = vi.fn();

    const toast = failureToast(
      new VolunteerApiError(404, "NOT_ON_DUTY"),
      "실패",
      onStale,
    );

    expect(toast).toEqual({ variant: "error", message: "실패" });
    expect(onStale).toHaveBeenCalledTimes(1);
  });
});
