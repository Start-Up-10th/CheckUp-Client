import { useEffect, useState } from "react";

export type Presence<T> = { item: T; closing: boolean };

/**
 * 목록에서 빠진 항목도 `exitMs` 동안 `closing`으로 남겨 항목마다 사라지는 애니메이션을 보일 수 있게 한다.
 * 새 항목은 뒤에 붙고 기존 항목은 자리를 지킨다. 항목은 `id`로 구분하고, 같은 `id`의 항목 객체는 렌더마다 같은
 * 참조여야 한다(바뀌면 새 값으로 갱신한다).
 */
export function usePresenceList<T extends { id: number | string }>(
  items: T[],
  exitMs: number,
): Presence<T>[] {
  const [rendered, setRendered] = useState<Presence<T>[]>(() =>
    items.map((item) => ({ item, closing: false })),
  );

  const live = new Map(items.map((item) => [item.id, item]));
  const known = new Set(rendered.map((entry) => entry.item.id));
  const next: Presence<T>[] = rendered.map((entry) => {
    const item = live.get(entry.item.id);
    return item
      ? { item, closing: false }
      : { item: entry.item, closing: true };
  });
  for (const item of items) {
    if (!known.has(item.id)) next.push({ item, closing: false });
  }
  const changed =
    next.length !== rendered.length ||
    next.some(
      (entry, index) =>
        entry.item !== rendered[index].item ||
        entry.closing !== rendered[index].closing,
    );
  // 렌더 중 상태 갱신: 목록이 달라졌을 때만 한다.
  if (changed) setRendered(next);

  const closingKey = next
    .filter((entry) => entry.closing)
    .map((entry) => entry.item.id)
    .join(",");
  useEffect(() => {
    if (!closingKey) return;
    const timer = setTimeout(
      () => setRendered((current) => current.filter((entry) => !entry.closing)),
      exitMs,
    );
    return () => clearTimeout(timer);
  }, [closingKey, exitMs]);

  return changed ? next : rendered;
}
