import { loginFailureMessage } from "./login-error";

describe("loginFailureMessage", () => {
  it("관리자 계정이 사용자 로그인으로 들어왔다는 코드는 관리자 로그인 안내 문구다", () => {
    expect(loginFailureMessage("ADMIN_ACCOUNT")).toBe(
      "관리자 계정은 관리자 로그인에서 로그인해 주세요.",
    );
  });

  it("error 쿼리가 없으면 실패가 아니다", () => {
    expect(loginFailureMessage(undefined)).toBeNull();
  });

  it.each([
    ["INACTIVE_ACCOUNT", "올바르지 않은 계정 상태입니다."],
    ["MISSING_STUDENT_INFO", "학생 정보가 없습니다."],
    ["UNSUPPORTED_ACCOUNT", "이용 권한이 없는 계정입니다."],
  ])("계정이 거부된 %s는 서버 문구를 보여 준다", (code, message) => {
    expect(loginFailureMessage(code)).toBe(message);
  });

  it.each(["1", "INVALID_OAUTH_STATE", "DATAGSM_UNAVAILABLE", ""])(
    "그 밖의 값 %j은 일반 실패 문구를 보여 준다",
    (code) => {
      expect(loginFailureMessage(code)).toBe(
        "로그인에 실패했습니다. 다시 시도해 주세요.",
      );
    },
  );

  it("객체 기본 속성 이름은 코드로 취급하지 않는다", () => {
    expect(loginFailureMessage("toString")).toBe(
      "로그인에 실패했습니다. 다시 시도해 주세요.",
    );
  });
});
