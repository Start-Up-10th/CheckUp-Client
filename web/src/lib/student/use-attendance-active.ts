"use client";

import { useEffect, useState } from "react";
import {
  fetchAttendanceActive,
  type AttendanceActive,
} from "./attendance-active-api";

/** 홈이 열려 있는 동안 출석 진행 여부를 다시 받는 주기(관리자 홈 전개도 DEC-103과 같은 30초, DEC-106). */
export const ATTENDANCE_ACTIVE_REFRESH_MS = 30_000;

/**
 * 지금 출석을 받는 중인지(#357, DEC-106). `enabled`(본인 정보를 받은 학생)일 때 처음 한 번, 그 뒤 30초마다,
 * 화면으로 돌아오면(`visibilitychange`) 바로 다시 받는다. 탭이 숨겨진 동안은 받지 않는다.
 * 받기 전이거나 받지 못했으면 null이다. 틀린 상태를 보이지 않도록 실패하면 null로 두고 다음 주기에 다시 받는다.
 */
export function useAttendanceActive(enabled: boolean): AttendanceActive | null {
  const [active, setActive] = useState<AttendanceActive | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    function refresh() {
      if (document.visibilityState !== "visible") return;
      fetchAttendanceActive()
        .then((next) => {
          if (!cancelled) setActive(next);
        })
        .catch(() => {
          if (!cancelled) setActive(null);
        });
    }
    refresh();
    const timer = setInterval(refresh, ATTENDANCE_ACTIVE_REFRESH_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [enabled]);

  return active;
}
