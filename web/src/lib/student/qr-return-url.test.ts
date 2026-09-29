import { QR_RETURN_URL_KEY, saveQrReturnUrl } from "./qr-return-url";

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
