"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { StatusBanner } from "@/components/admin/StatusBanner";
import { usePresenceList } from "@/hooks/use-presence-list";

/**
 * 노션 기능명세서 `로그인 성공 안내`(상태 메시지 표시 규격): 성공 메시지는 2초 뒤 자동으로 사라지고 오류 메시지는 4초 동안
 * 유지한다. 안내(neutral)는 명세에 없어 성공과 같이 2초다. 닫기 동작은 Figma에 없어 두지 않는다. 시간은 토스트마다 따로 센다.
 */
const TOAST_DURATION_MS: Record<ToastMessage["variant"], number> = {
  success: 2000,
  neutral: 2000,
  error: 4000,
};

/** 한꺼번에 쌓아 두는 최대 개수. 넘으면 가장 오래된 것부터 지운다. */
const MAX_TOASTS = 5;

export type ToastMessage = {
  variant: "success" | "error" | "neutral";
  message: string;
};

/** 쌓인 토스트 한 개. `id`로 구분한다. */
export type ToastItem = ToastMessage & { id: number | string };

/**
 * 화면 위쪽 가운데에 잠깐 떴다 사라지는 상태 메시지들(REQ-UI-006). 새 토스트는 이전 것을 지우지 않고 쌓이며 각자 자기
 * 시간이 지나면 따로 사라진다. 같은 문구를 다시 띄우면 이전 것을 지우고 새로 시작한다. `toast`는 가장 새 토스트다.
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // 최신 목록. 갱신 함수가 언제 실행될지에 기대지 않도록 여기서 바로 계산하고 화면 상태에 옮긴다.
  const listRef = useRef<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef(
    new Map<number | string, ReturnType<typeof setTimeout>>(),
  );

  const commit = useCallback((next: ToastItem[]) => {
    listRef.current = next;
    setToasts(next);
  }, []);

  const clearTimer = useCallback((id: number | string) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const dismiss = useCallback(
    (id: number | string) => {
      clearTimer(id);
      commit(listRef.current.filter((toast) => toast.id !== id));
    },
    [clearTimer, commit],
  );

  const showToast = useCallback(
    (next: ToastMessage) => {
      // 같은 문구가 이미 떠 있으면 새로 쌓지 않고 그 토스트의 시간만 다시 센다.
      const same = listRef.current.find(
        (toast) =>
          toast.variant === next.variant && toast.message === next.message,
      );
      let id: number | string;
      if (same) {
        id = same.id;
      } else {
        nextId.current += 1;
        id = nextId.current;
        // 개수가 넘치면 가장 오래된 것부터 지운다.
        const room = MAX_TOASTS - 1;
        const overflow = Math.max(0, listRef.current.length - room);
        listRef.current.slice(0, overflow).forEach((old) => clearTimer(old.id));
        commit([...listRef.current.slice(overflow), { id, ...next }]);
      }
      clearTimer(id);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), TOAST_DURATION_MS[next.variant]),
      );
    },
    [clearTimer, commit, dismiss],
  );

  useEffect(() => {
    const active = timers.current;
    return () => {
      active.forEach((timer) => clearTimeout(timer));
      active.clear();
    };
  }, []);

  return { toasts, toast: toasts[toasts.length - 1] ?? null, showToast };
}

/** 사라지는 애니메이션 시간. `tailwind.config.ts`의 `toast-out`(200ms)과 같다. */
export const TOAST_EXIT_MS = 200;

/**
 * 위치 규칙(사용자 결정 2026-10-07, 핸드폰·패드·컴퓨터 공통, 관리자·사용자 토스트 공통): 화면 위쪽 가운데에 뜬다.
 * - 위: 핸드폰 12px, 패드 20px, 컴퓨터 24px. 노치·상태바가 있는 기기는 `env(safe-area-inset-top)`만큼 더 내린다.
 * - 토스트 바깥은 `pointer-events-none`이라 아래 화면 조작을 막지 않는다. 모달(z-40) 위에 표시되도록 z-50이다.
 * - 애니메이션: 위에서 내려오며 나타나고(`toast-in`) 사라질 때는 위로 올라가며 흐려진다(`toast-out`). OS의 `동작 줄이기`를
 *   켠 사용자는 애니메이션 없이 보인다. `contentKey`가 바뀌면 다시 나타나는 애니메이션을 한다.
 * 폭은 `widthClassName`이 정한다(관리자 기본: 핸드폰 전체·최대 354, 패드 320, 컴퓨터 400).
 */
export function ToastFrame({
  closing,
  contentKey,
  widthClassName = "w-full max-w-[354px] md:w-[320px] md:max-w-none xl:w-[400px]",
  children,
}: {
  closing: boolean;
  contentKey: string;
  widthClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-[18px] top-[calc(env(safe-area-inset-top)+12px)] z-50 flex justify-center md:top-[calc(env(safe-area-inset-top)+20px)] xl:top-[calc(env(safe-area-inset-top)+24px)]">
      <div
        key={contentKey}
        className={`pointer-events-auto motion-reduce:animate-none ${closing ? "animate-toast-out" : "animate-toast-in"} ${widthClassName}`}
      >
        {children}
      </div>
    </div>
  );
}

/** 쌓인 토스트가 겹쳐 보일 때 뒤 토스트가 앞 토스트 아래로 삐져나오는 높이. */
const PEEK_PX = 10;
/** 펼쳤을 때 토스트 사이 간격. */
const GAP_PX = 8;
/** 접힌 상태에서 앞 토스트 뒤에 보이는 최대 개수. 더 오래된 것은 숨긴다. */
const VISIBLE_BEHIND = 2;

/** 토스트 한 개. 높이를 재서 스택이 위치를 계산하게 알린다. */
function StackToast({
  entry,
  index,
  expanded,
  offset,
  frontHeight,
  compactOnPhone,
  onHeight,
}: {
  entry: { item: ToastItem; closing: boolean };
  index: number;
  expanded: boolean;
  offset: number;
  frontHeight: number;
  compactOnPhone: boolean;
  onHeight: (id: number | string, height: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { item, closing } = entry;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const report = () => onHeight(item.id, node.offsetHeight);
    report();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(report);
    observer.observe(node);
    return () => observer.disconnect();
  }, [item.id, onHeight]);

  // 접힌 상태: 앞 토스트 뒤에 조금씩 작게 겹쳐 보이고 너무 뒤의 것은 숨긴다. 펼치면 모두 원래 크기로 세로로 늘어선다.
  const hidden = !expanded && index > VISIBLE_BEHIND;
  const scale = expanded ? 1 : 1 - Math.min(index, VISIBLE_BEHIND) * 0.05;
  const opacity = hidden ? 0 : expanded ? 1 : 1 - index * 0.12;
  return (
    <div
      ref={ref}
      data-toast-item
      className="absolute inset-x-0 top-0 origin-top transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none"
      style={{
        transform: `translateY(${offset}px) scale(${scale})`,
        opacity,
        zIndex: 100 - index,
        // 접힌 뒤 토스트가 앞 토스트보다 길어도 아래로 삐져나오지 않게 맞춘다.
        maxHeight:
          !expanded && index > 0 && frontHeight > 0 ? frontHeight : undefined,
        overflow: !expanded && index > 0 ? "hidden" : undefined,
      }}
    >
      <div
        key={item.message}
        className={`motion-reduce:animate-none ${closing ? "animate-toast-out" : "animate-toast-in"}`}
      >
        <StatusBanner
          variant={item.variant}
          message={item.message}
          compactOnPhone={compactOnPhone}
        />
      </div>
    </div>
  );
}

/**
 * 관리자 토스트 묶음. 가장 새 토스트가 맨 앞이고 이전 것은 뒤에 겹쳐 보인다. 마우스를 올리면 세로로 펼쳐 전부 읽을 수 있고
 * (터치 화면은 누르면 펼침·접힘), 토스트마다 자기 시간이 지나면 따로 사라진다.
 * `toasts`는 오래된 것부터의 목록(`useToast`)이고, `toast`는 상태가 풀릴 때까지 유지하는 단일 토스트(얼굴 인식·QR 생성)다.
 * 둘 다 없어져도 사라지는 애니메이션이 끝날 때까지 마지막 토스트를 그린다.
 * `compactOnPhone`은 핸드폰 폭에서 글자·여백을 줄이고(관리자 핸드폰 상태 메시지 크기 통일, 사용자 결정 2026-10-02),
 * 패드 이상은 Figma 크기 그대로다.
 * 전체화면 카메라(얼굴 인식 전체화면) 중 토스트는 Fullscreen API 제약으로 별도 처리가 필요하며 현재 미구현.
 */
export function ToastLayer({
  toasts,
  toast = null,
  compactOnPhone = true,
}: {
  toasts?: ToastItem[];
  toast?: ToastMessage | null;
  compactOnPhone?: boolean;
}) {
  // 단일 `toast`는 한 자리를 쓴다: 문구가 바뀌면 이전 것이 사라지는 동안 겹쳐 쌓이지 않고 그 자리에서 바로 바뀐다(상태가
  // 하나씩만 보인다). 렌더마다 새 객체여도 문구가 같으면 같은 참조를 유지한다.
  const singleVariant = toast?.variant;
  const singleMessage = toast?.message;
  const single = useMemo<ToastItem[]>(
    () =>
      singleVariant && singleMessage !== undefined
        ? [
            {
              id: "single",
              variant: singleVariant,
              message: singleMessage,
            },
          ]
        : [],
    [singleVariant, singleMessage],
  );
  const entries = usePresenceList(toasts ?? single, TOAST_EXIT_MS);

  const [expanded, setExpanded] = useState(false);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const onHeight = useCallback((id: number | string, height: number) => {
    setHeights((current) =>
      current[String(id)] === height
        ? current
        : { ...current, [String(id)]: height },
    );
  }, []);

  if (entries.length === 0) return null;

  // 맨 앞(가장 새 것)이 index 0이다.
  const ordered = [...entries].reverse();
  const heightOf = (entry: (typeof ordered)[number]) =>
    heights[String(entry.item.id)] ?? 0;
  const frontHeight = heightOf(ordered[0]);
  const offsets: number[] = [];
  let running = 0;
  ordered.forEach((entry, index) => {
    offsets.push(
      expanded ? running : Math.min(index, VISIBLE_BEHIND + 1) * PEEK_PX,
    );
    running += heightOf(entry) + GAP_PX;
  });
  const stackHeight = expanded
    ? Math.max(0, running - GAP_PX)
    : frontHeight + Math.min(ordered.length - 1, VISIBLE_BEHIND) * PEEK_PX;

  return (
    <div className="pointer-events-none fixed inset-x-[18px] top-[calc(env(safe-area-inset-top)+12px)] z-50 flex justify-center md:top-[calc(env(safe-area-inset-top)+20px)] xl:top-[calc(env(safe-area-inset-top)+24px)]">
      <div
        data-toast-stack
        data-expanded={expanded}
        className="pointer-events-auto relative w-full max-w-[354px] transition-[height] duration-200 ease-out motion-reduce:transition-none md:w-[320px] md:max-w-none xl:w-[400px]"
        style={{ height: stackHeight }}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setExpanded(true);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") setExpanded(false);
        }}
        onPointerDown={(event) => {
          // 마우스가 없는 화면(터치)에서는 누르면 펼치고 다시 누르면 접는다.
          if (event.pointerType !== "mouse") setExpanded((value) => !value);
        }}
      >
        {ordered.map((entry, index) => (
          <StackToast
            key={entry.item.id}
            entry={entry}
            index={index}
            expanded={expanded}
            offset={offsets[index]}
            frontHeight={frontHeight}
            compactOnPhone={compactOnPhone}
            onHeight={onHeight}
          />
        ))}
      </div>
    </div>
  );
}
