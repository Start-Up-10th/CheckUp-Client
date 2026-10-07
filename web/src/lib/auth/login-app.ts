/**
 * 로그인을 어느 앱(PWA)에서 시작했는지. 관리자 앱(`/admin`)과 사용자 앱(`/`)은 따로 설치하지만(DEC-024·025) 서버 로그인
 * 콜백은 한 주소(`/login/complete`)로만 돌아온다. 그래서 로그인을 시작할 때 어느 앱인지 적어 두었다가 콜백 뒤에 읽어
 * 기숙사 자치위원(관리자이면서 학생)을 그 앱으로 보낸다(DEC-047).
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
    // 저장소를 막은 브라우저(시크릿 모드 등)에서는 기억하지 못한다. 기본(사용자 앱)으로 동작한다.
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
 * 콜백 뒤에 어느 앱에서 시작했는지 한 번 읽고 지운다. 기록이 없거나 오래됐거나 읽을 수 없으면 사용자 앱이다
 * (설치한 사용자 앱·학생 로그인이 기본 진입점이다).
 */
export function takeLoginApp(now: number = Date.now()): LoginApp {
  const store = storage();
  if (!store) return "user";
  let raw: string | null = null;
  try {
    raw = store.getItem(STORAGE_KEY);
    store.removeItem(STORAGE_KEY);
  } catch {
    return "user";
  }
  if (!raw) return "user";
  try {
    const parsed = JSON.parse(raw) as Partial<Stored>;
    const fresh =
      typeof parsed.at === "number" &&
      now - parsed.at >= 0 &&
      now - parsed.at <= LOGIN_APP_TTL_MS;
    return fresh && parsed.app === "admin" ? "admin" : "user";
  } catch {
    return "user";
  }
}
