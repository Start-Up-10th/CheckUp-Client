"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 관리자 다이얼로그·메뉴 시트가 함께 쓰는 모달 동작(REQ-UI-006).
 * 반환한 `ref`를 패널(`tabIndex={-1}`)에 붙인다. 패널이 화면에 있는 동안:
 * - Esc로 닫는다(`onClose`).
 * - 열릴 때 패널로 키보드 포커스를 옮기고, Tab·Shift+Tab이 패널 안에서만 돈다.
 * - 닫힐 때 열기 전에 포커스가 있던 요소(보통 눌렀던 버튼)로 포커스를 돌려준다.
 * - 패널이 `main` 안에 있으면 그 `main`의 스크롤을 잠가 뒤 화면이 휠로 움직이지 않게 한다. 스크롤바가 자리를 차지하고
 *   있었다면 사라지며 내용이 밀리지 않도록 `scrollbar-gutter: stable`을 함께 쓰고, 없었다면 켜지 않는다(켜면 오히려 밀린다).
 */
export function useModalDialog<T extends HTMLElement = HTMLDivElement>(
  onClose: () => void,
) {
  const ref = useRef<T>(null);
  // 렌더마다 새 함수여도 이벤트를 다시 달지 않도록 최신 값만 들고 있는다.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const panel = ref.current;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    panel?.focus({ preventScroll: true });

    const scroller = panel?.closest("main") ?? null;
    const previousOverflowY = scroller?.style.overflowY ?? "";
    const previousGutter = scroller?.style.scrollbarGutter ?? "";
    if (scroller) {
      // 스크롤바가 지금 자리를 차지하고 있을 때만 그 자리를 남긴다. 내용이 넘치지 않아 스크롤바가 없던 화면(또는 자리를
      // 차지하지 않는 겹침 스크롤바)에서 `stable`을 켜면 그 순간 스크롤바 자리가 새로 생겨 뒤 화면이 옆으로 밀린다.
      const hasScrollbarSpace = scroller.offsetWidth > scroller.clientWidth;
      if (hasScrollbarSpace) scroller.style.scrollbarGutter = "stable";
      scroller.style.overflowY = "hidden";
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeRef.current();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const items = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((element) => !element.hasAttribute("disabled"));
      if (items.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (!panel.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (scroller) {
        scroller.style.overflowY = previousOverflowY;
        scroller.style.scrollbarGutter = previousGutter;
      }
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  return ref;
}
