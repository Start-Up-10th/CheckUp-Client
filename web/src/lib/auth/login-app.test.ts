import { LOGIN_APP_TTL_MS, rememberLoginApp, takeLoginApp } from "./login-app";

const NOW = 1_700_000_000_000;

beforeEach(() => window.localStorage.clear());

describe("로그인을 시작한 앱 기억", () => {
  it("기록이 없으면 알 수 없음(null)이다", () => {
    expect(takeLoginApp(NOW)).toBeNull();
  });

  it("관리자 앱에서 시작했다고 적으면 읽을 때 관리자 앱이고 한 번 읽으면 지운다", () => {
    rememberLoginApp("admin", NOW);

    expect(takeLoginApp(NOW + 1000)).toBe("admin");
    expect(takeLoginApp(NOW + 2000)).toBeNull();
  });

  it("사용자 앱에서 시작했다고 적으면 이전에 남은 관리자 기록을 덮어쓴다", () => {
    rememberLoginApp("admin", NOW);
    rememberLoginApp("user", NOW + 500);

    expect(takeLoginApp(NOW + 1000)).toBe("user");
  });

  it("오래된 기록(10분 초과)은 무시하고 null이다", () => {
    rememberLoginApp("admin", NOW);

    expect(takeLoginApp(NOW + LOGIN_APP_TTL_MS + 1)).toBeNull();
  });

  it("읽을 수 없는 기록은 null이다", () => {
    window.localStorage.setItem("checkup:login-app", "{");

    expect(takeLoginApp(NOW)).toBeNull();
  });

  it("저장소를 쓸 수 없어도 오류 없이 null이다", () => {
    const spy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });

    expect(takeLoginApp(NOW)).toBeNull();
    spy.mockRestore();
  });
});
