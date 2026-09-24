"use client";

import { useEffect } from "react";

/**
 * 설치 가능한 앱 셸(DEC-024)을 위해 정적 자산 캐시용 서비스워커만 등록한다.
 * 개발 서버에서는 등록하지 않는다 — 캐시 우선(cache-first)으로 `/_next/static/`을 저장해
 * 코드를 고쳐도 옛 CSS/JS가 계속 나오기 때문이다. 이전에 등록된 것이 있으면 해제하고 캐시도 지운다.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          registrations.forEach(
            (registration) => void registration.unregister(),
          ),
        );
      if (typeof caches !== "undefined") {
        void caches
          .keys()
          .then((keys) =>
            keys
              .filter((key) => key.startsWith("app-shell-"))
              .forEach((key) => void caches.delete(key)),
          );
      }
      return;
    }

    function register() {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // 설치 가능 여부에 영향을 주지 않는 부가 기능이므로 실패해도 조용히 넘어간다.
      });
    }

    // 하이드레이션이 load 이벤트보다 늦으면 리스너를 달아도 영영 안 불리므로 이미 로드됐으면 바로 등록한다.
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
