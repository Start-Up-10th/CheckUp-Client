"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { syncTheme } from "@/lib/theme";

/**
 * 화면을 옮길 때마다 그 주소에 맞는 화면 모드를 다시 붙인다(REQ-UI-008). 새로 고침 없이 학생 화면에서
 * 관리자 화면(항상 라이트)으로 가거나 돌아올 때 `<head>` 스크립트가 다시 돌지 않기 때문이다.
 */
export function ThemeRouteSync() {
  const pathname = usePathname();

  useEffect(() => {
    syncTheme();
  }, [pathname]);

  return null;
}
