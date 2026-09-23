"use client";

import { useEffect } from "react";

/** 설치 가능한 앱 셸(DEC-024)을 위해 정적 자산 캐시용 서비스워커만 등록한다. */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    function register() {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // 설치 가능 여부에 영향을 주지 않는 부가 기능이므로 실패해도 조용히 넘어간다.
      });
    }
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
