import { describe, expect, it } from "vitest";
import {
  DEFAULT_RETRY_AFTER_MS,
  MAX_RETRY_AFTER_MS,
  RateLimitedError,
  parseRetryAfter,
  throwIfRateLimited,
} from "./rate-limit";

const NOW = Date.parse("2026-10-07T00:00:00Z");

describe("parseRetryAfter", () => {
  it("초 단위 정수를 밀리초로 바꾼다", () => {
    expect(parseRetryAfter("3", NOW)).toBe(3000);
    expect(parseRetryAfter(" 0 ", NOW)).toBe(0);
  });

  it("HTTP 날짜는 지금과의 차이이고 이미 지났으면 0이다", () => {
    expect(parseRetryAfter("Wed, 07 Oct 2026 00:00:05 GMT", NOW)).toBe(5000);
    expect(parseRetryAfter("Wed, 07 Oct 2026 00:00:00 GMT", NOW + 9000)).toBe(
      0,
    );
  });

  it("없거나 읽을 수 없으면 기본 대기 시간이다", () => {
    expect(parseRetryAfter(null, NOW)).toBe(DEFAULT_RETRY_AFTER_MS);
    expect(parseRetryAfter(undefined, NOW)).toBe(DEFAULT_RETRY_AFTER_MS);
    expect(parseRetryAfter("", NOW)).toBe(DEFAULT_RETRY_AFTER_MS);
    expect(parseRetryAfter("곧", NOW)).toBe(DEFAULT_RETRY_AFTER_MS);
    expect(parseRetryAfter("-5", NOW)).toBe(DEFAULT_RETRY_AFTER_MS);
  });

  it("너무 긴 시간은 상한으로 줄인다", () => {
    expect(parseRetryAfter("86400", NOW)).toBe(MAX_RETRY_AFTER_MS);
  });
});

describe("throwIfRateLimited", () => {
  it("429면 Retry-After를 담은 RateLimitedError를 던진다", () => {
    const res = new Response(null, {
      status: 429,
      headers: { "Retry-After": "4" },
    });

    expect(() => throwIfRateLimited(res)).toThrow(RateLimitedError);
    try {
      throwIfRateLimited(res);
    } catch (error) {
      expect((error as RateLimitedError).retryAfterMs).toBe(4000);
    }
  });

  it("헤더가 없는 429는 기본 대기 시간이다", () => {
    try {
      throwIfRateLimited(new Response(null, { status: 429 }));
    } catch (error) {
      expect((error as RateLimitedError).retryAfterMs).toBe(
        DEFAULT_RETRY_AFTER_MS,
      );
    }
  });

  it("429가 아니면 던지지 않는다", () => {
    expect(() =>
      throwIfRateLimited(new Response(null, { status: 500 })),
    ).not.toThrow();
    expect(() =>
      throwIfRateLimited(new Response(null, { status: 200 })),
    ).not.toThrow();
  });
});
