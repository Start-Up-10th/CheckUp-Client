import {
  QR_RETURN_URL_KEY,
  saveQrReturnUrl,
  takeQrReturnUrl,
} from "./qr-return-url";

afterEach(() => {
  window.sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("saveQrReturnUrl", () => {
  it("같은 QR로 돌아올 주소를 저장한다", () => {
    saveQrReturnUrl("a".repeat(43));

    expect(window.sessionStorage.getItem(QR_RETURN_URL_KEY)).toBe(
      `/qr#t=${"a".repeat(43)}`,
    );
  });

  it("저장소를 쓸 수 없어도 오류를 내지 않는다", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => saveQrReturnUrl("a".repeat(43))).not.toThrow();
  });
});

describe("takeQrReturnUrl", () => {
  const url = `/qr#t=${"a".repeat(43)}`;

  it("저장한 QR 주소를 돌려주고 지운다", () => {
    window.sessionStorage.setItem(QR_RETURN_URL_KEY, url);

    expect(takeQrReturnUrl()).toBe(url);
    expect(window.sessionStorage.getItem(QR_RETURN_URL_KEY)).toBeNull();
  });

  it("저장한 값이 없으면 null", () => {
    expect(takeQrReturnUrl()).toBeNull();
  });

  it.each([
    ["다른 경로", "/main"],
    ["외부 주소", `https://evil.example.com/qr#t=${"a".repeat(43)}`],
    ["//로 시작", `//evil.example.com/qr#t=${"a".repeat(43)}`],
    ["토큰 길이 다름", `/qr#t=${"a".repeat(10)}`],
    ["뒤에 값이 붙음", `/qr#t=${"a".repeat(43)}&x=1`],
  ])("%s이면 버리고 null (값은 지운다)", (_, value) => {
    window.sessionStorage.setItem(QR_RETURN_URL_KEY, value);

    expect(takeQrReturnUrl()).toBeNull();
    expect(window.sessionStorage.getItem(QR_RETURN_URL_KEY)).toBeNull();
  });

  it("저장소를 쓸 수 없으면 null", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(takeQrReturnUrl()).toBeNull();
  });
});
