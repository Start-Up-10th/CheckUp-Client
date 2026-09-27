import { parseQrToken } from "./parse-qr-token";

// 테스트용 43자 base64url 토큰(실제 토큰 아님)
const TOKEN = "AbCdEfGhIjKlMnOpQrStUvWxYz0123456789-_AbCdE";

it("테스트 토큰은 43자다", () => {
  expect(TOKEN).toHaveLength(43);
});

describe("parseQrToken", () => {
  it("/qr#t=<43자 토큰> URL에서 토큰을 꺼낸다", () => {
    expect(parseQrToken(`https://checkup.example.com/qr#t=${TOKEN}`)).toBe(
      TOKEN,
    );
  });

  it("웹 주소(호스트)는 비교하지 않는다", () => {
    expect(parseQrToken(`http://localhost:3000/qr#t=${TOKEN}`)).toBe(TOKEN);
  });

  it("주소가 아닌 값은 null", () => {
    expect(parseQrToken(TOKEN)).toBeNull();
    expect(parseQrToken("")).toBeNull();
    expect(parseQrToken(`/qr#t=${TOKEN}`)).toBeNull();
  });

  it("경로가 정확히 /qr이 아니면 null", () => {
    expect(
      parseQrToken(`https://checkup.example.com/qr/#t=${TOKEN}`),
    ).toBeNull();
    expect(
      parseQrToken(`https://checkup.example.com/main#t=${TOKEN}`),
    ).toBeNull();
    expect(parseQrToken(`https://checkup.example.com/#t=${TOKEN}`)).toBeNull();
  });

  it("hash가 없거나 #t=가 아니면 null", () => {
    expect(parseQrToken("https://checkup.example.com/qr")).toBeNull();
    expect(
      parseQrToken(`https://checkup.example.com/qr#x=${TOKEN}`),
    ).toBeNull();
    expect(
      parseQrToken(`https://checkup.example.com/qr?t=${TOKEN}`),
    ).toBeNull();
  });

  it("토큰이 43자가 아니면 null", () => {
    expect(
      parseQrToken(`https://checkup.example.com/qr#t=${TOKEN.slice(1)}`),
    ).toBeNull();
    expect(
      parseQrToken(`https://checkup.example.com/qr#t=${TOKEN}A`),
    ).toBeNull();
    expect(parseQrToken("https://checkup.example.com/qr#t=")).toBeNull();
  });

  it("base64url이 아닌 문자가 있으면 null", () => {
    const withPlus = `${TOKEN.slice(0, 42)}+`;
    expect(
      parseQrToken(`https://checkup.example.com/qr#t=${withPlus}`),
    ).toBeNull();
  });

  it("hash 뒤에 다른 값이 붙으면 null", () => {
    expect(
      parseQrToken(`https://checkup.example.com/qr#t=${TOKEN}&x=1`),
    ).toBeNull();
  });
});
