import { AdminUnauthorizedError } from "./qr-api";
import { RATE_LIMIT_MESSAGE, RateLimitedError } from "./rate-limit";
import { failureToast, listFailureToast } from "./volunteer-action";
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

  it("429는 잠시 후 다시 시도 안내(neutral)이고 명단을 다시 받지 않는다", () => {
    const onStale = vi.fn();

    const toast = failureToast(new RateLimitedError(3000), "실패", onStale);

    expect(toast).toEqual({ variant: "neutral", message: RATE_LIMIT_MESSAGE });
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

describe("listFailureToast", () => {
  it("429면 잠시 후 다시 시도 안내, 아니면 목록 오류 문구다", () => {
    expect(listFailureToast(true, "목록 실패")).toEqual({
      variant: "neutral",
      message: RATE_LIMIT_MESSAGE,
    });
    expect(listFailureToast(false, "목록 실패")).toEqual({
      variant: "error",
      message: "목록 실패",
    });
  });
});
