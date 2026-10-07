/** 429(요청이 너무 많음)일 때 화면이 보이는 안내. 학생 QR 화면의 `잠시 후 다시 시도해 주세요.`와 같다. */
export const RATE_LIMIT_MESSAGE = "잠시 후 다시 시도해 주세요.";

/** `Retry-After`가 없거나 읽을 수 없을 때 기다리는 시간. */
export const DEFAULT_RETRY_AFTER_MS = 1000;
/** 서버가 아주 긴 시간을 알려도 화면이 그만큼 멈추지 않도록 두는 상한. */
export const MAX_RETRY_AFTER_MS = 60_000;

/**
 * 서버가 429로 답했다. `retryAfterMs`는 `Retry-After`를 읽은 대기 시간이고 헤더가 없거나 읽을 수 없으면
 * `DEFAULT_RETRY_AFTER_MS`다. 어느 API인지와 상관없이 같은 오류로 던져 화면이 한 가지로 안내한다.
 */
export class RateLimitedError extends Error {
  constructor(readonly retryAfterMs: number = DEFAULT_RETRY_AFTER_MS) {
    super(`rate limited: retry after ${retryAfterMs}ms`);
  }
}

/**
 * `Retry-After` 값(초 단위 정수 또는 HTTP 날짜)을 밀리초로 바꾼다. 없거나 읽을 수 없으면 기본값, 너무 길면 상한이다.
 * 날짜는 `now`(기본 지금)와의 차이이고 이미 지났으면 0이다.
 */
export function parseRetryAfter(
  value: string | null | undefined,
  now: number = Date.now(),
): number {
  const text = value?.trim();
  if (!text) return DEFAULT_RETRY_AFTER_MS;
  let ms: number;
  if (/^\d+$/.test(text)) {
    ms = Number(text) * 1000;
  } else {
    // 숫자로 시작하는데 정수가 아닌 값(`-5`, `1.5`)은 날짜로 읽지 않고 기본값을 쓴다.
    if (/^[-+.\d]+$/.test(text)) return DEFAULT_RETRY_AFTER_MS;
    const date = Date.parse(text);
    if (Number.isNaN(date)) return DEFAULT_RETRY_AFTER_MS;
    ms = Math.max(0, date - now);
  }
  return Math.min(ms, MAX_RETRY_AFTER_MS);
}

/** 응답이 429면 `Retry-After`를 읽어 `RateLimitedError`를 던진다. 아니면 아무 것도 하지 않는다. */
export function throwIfRateLimited(res: Response): void {
  if (res.status === 429) {
    throw new RateLimitedError(
      parseRetryAfter(res.headers?.get("Retry-After")),
    );
  }
}
