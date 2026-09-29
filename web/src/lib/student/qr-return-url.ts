/** 로그인 후 돌아올 QR 주소를 담는 sessionStorage 키. 로그인 복귀 처리(서버 #29)가 이 값을 읽는다. */
export const QR_RETURN_URL_KEY = "checkup:qr-return-url";

/**
 * 미로그인으로 QR 제출이 거부되면 같은 QR로 돌아올 주소(`/qr#t=<토큰>`)를 저장한다(REQ-ATT-005).
 * `#t=`는 서버로 전송되지 않아 서버 리다이렉트만으로는 복원할 수 없으므로 브라우저에 남긴다.
 * 토큰은 최대 15분짜리 값이고 탭을 닫으면 사라진다. 저장소를 쓸 수 없으면(사생활 보호 모드 등) 무시한다.
 */
export function saveQrReturnUrl(token: string): void {
  try {
    window.sessionStorage.setItem(QR_RETURN_URL_KEY, `/qr#t=${token}`);
  } catch {
    // 저장하지 못해도 로그인 이동은 진행한다.
  }
}
