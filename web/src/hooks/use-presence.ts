import { useEffect, useState } from "react";

/**
 * 값이 null이 된 뒤에도 `exitMs` 동안 마지막 값을 돌려줘서 사라지는 애니메이션을 보일 수 있게 한다.
 * `closing`이 true인 동안이 퇴장 구간이다. `isSame`은 값이 같은지 비교한다(기본은 `Object.is`). 렌더마다 새 객체를
 * 만들어 넘기면 내용을 비교하는 함수를 줘야 한다.
 */
export function usePresence<T>(
  value: T | null,
  exitMs: number,
  isSame: (a: T, b: T) => boolean = Object.is,
): { current: T | null; closing: boolean } {
  const [shown, setShown] = useState<T | null>(value);
  // 새 값이 오면 바로 그 값을 보인다(렌더 중 상태 갱신, 이전 값과 다를 때만).
  if (value !== null && (shown === null || !isSame(value, shown))) {
    setShown(value);
  }
  const closing = value === null && shown !== null;

  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => setShown(null), exitMs);
    return () => clearTimeout(timer);
  }, [closing, exitMs]);

  return { current: value ?? shown, closing };
}
