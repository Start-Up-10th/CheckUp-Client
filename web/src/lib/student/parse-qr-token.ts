/** QR 토큰: 32바이트 난수를 base64url로 쓴 43자(하네스 DEC-018, docs/plans/qr-attendance.md "QR 값 형식"). */
const TOKEN_HASH = /^#t=([A-Za-z0-9_-]{43})$/;

/**
 * QR 값 `https://<웹 주소>/qr#t=<토큰>`에서 토큰을 꺼낸다(REQ-ATT-005, 하네스 DEC-018).
 * 경로가 정확히 `/qr`이고 hash가 `#t=<43자 토큰>`일 때만 토큰을 돌려주고, 그 밖은 모두 null이다
 * (주소가 아닌 값, 다른 경로, 토큰 길이·문자가 다른 값, hash 뒤에 다른 값이 붙은 경우).
 * 웹 주소(호스트)는 서버 설정값이라 여기서 비교하지 않는다 — 토큰이 진짜인지는 서버가 판정한다.
 * 토큰은 학생 출석에 쓰이는 값이라 로그·오류 메시지에 남기지 않는다.
 */
export function parseQrToken(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.pathname !== "/qr") return null;
  return TOKEN_HASH.exec(url.hash)?.[1] ?? null;
}
