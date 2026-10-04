import { parseQrToken } from "./parse-qr-token";

/** 로그인 후 돌아올 QR 주소를 담는 sessionStorage 키. 로그인 완료 페이지가 takeQrReturnUrl로 읽는다. */
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

/**
 * 로그인을 마치고 돌아왔을 때 저장해 둔 QR 주소를 꺼내고 지운다(한 번만 쓴다).
 * 값이 `/qr#t=<43자 토큰>` 형식이 아니면 버린다 — 저장소 값이 바뀌어 다른 주소로 보내지는 일을 막는다.
 * 저장소를 쓸 수 없으면 null이다.
 */
export function takeQrReturnUrl(): string | null {
  let value: string | null;
  try {
    value = window.sessionStorage.getItem(QR_RETURN_URL_KEY);
    window.sessionStorage.removeItem(QR_RETURN_URL_KEY);
  } catch {
    return null;
  }
  if (!value?.startsWith("/qr#t=")) return null;
  return parseQrToken(`${window.location.origin}${value}`) ? value : null;
}
