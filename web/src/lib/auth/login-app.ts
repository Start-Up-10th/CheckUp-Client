/**
 * 어느 로그인 화면에서 시작했는지. 관리자 로그인(`/admin/login`)과 사용자 로그인(`/login`)은 서버 로그인 콜백이 한 주소
 * (`/login/complete`)로만 돌아온다. 그래서 로그인을 시작할 때 적어 두었다가 콜백 뒤에 읽어, 사용자 로그인으로 들어온
 * 관리자 권한 계정을 막는다(관리자는 관리자 로그인으로만 로그인한다, DEC-055).
 */
export type LoginApp = "admin" | "user";

const STORAGE_KEY = "checkup:login-app";
/** 로그인 도중에 앱이 바뀌지 않도록 기억하는 시간. 오래된 기록은 무시한다. */
export const LOGIN_APP_TTL_MS = 10 * 60 * 1000;

type Stored = { app: LoginApp; at: number };

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    // 저장소를 막은 브라우저(시크릿 모드 등)에서는 기억하지 못한다. 알 수 없음(null)으로 동작한다.
    return null;
  }
}

/** 로그인을 시작하기 직전에 어느 앱인지 적는다. */
export function rememberLoginApp(
  app: LoginApp,
  now: number = Date.now(),
): void {
  try {
    storage()?.setItem(
      STORAGE_KEY,
      JSON.stringify({ app, at: now } satisfies Stored),
    );
  } catch {
    // 저장하지 못해도 로그인은 계속한다.
  }
}

/**
 * 콜백 뒤에 어느 로그인에서 시작했는지 한 번 읽고 지운다. 기록이 없거나 오래됐거나 읽을 수 없으면 null(알 수 없음)이다.
 * 알 수 없을 때 관리자 계정을 쫓아내지 않도록 부르는 쪽이 느슨하게 처리한다.
 */
export function takeLoginApp(now: number = Date.now()): LoginApp | null {
  const store = storage();
  if (!store) return null;
  let raw: string | null = null;
  try {
    raw = store.getItem(STORAGE_KEY);
    store.removeItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Stored>;
    const fresh =
      typeof parsed.at === "number" &&
      now - parsed.at >= 0 &&
      now - parsed.at <= LOGIN_APP_TTL_MS;
    if (!fresh) return null;
    return parsed.app === "admin" || parsed.app === "user" ? parsed.app : null;
  } catch {
    return null;
  }
}
