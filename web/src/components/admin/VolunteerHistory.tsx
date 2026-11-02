"use client";

import { useEffect, useState } from "react";
import { StatusBanner } from "@/components/admin/StatusBanner";
import { redirectToAdminLogin } from "@/lib/admin/admin-session";
import { AdminUnauthorizedError } from "@/lib/admin/qr-api";
import {
  useVolunteerHistoryGateway,
  type VolunteerHistoryItem,
} from "@/lib/admin/volunteer-history-gateway";
import type { RosterStudent } from "@/lib/admin/volunteer-types";

type VolunteerHistoryProps = {
  student: RosterStudent;
};

type HistoryState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; items: VolunteerHistoryItem[] };

/** Figma 07 state messages. */
const HISTORY_ERROR_MESSAGE =
  "봉사 이력을 불러오지 못했습니다. 다시 시도해 주세요.";
const HISTORY_EMPTY_MESSAGE = "봉사 이력이 없습니다.";

/**
 * 봉사자 명단(07) 학생 상세의 봉사 이력(날짜·활동명·±횟수, Figma 07). 상세 창은 횟수 조정 다이얼로그
 * (`StudentDetailDialog`)이고 이 목록은 그 사유 아래에 놓인다(DEC-116).
 */
export function VolunteerHistory({ student }: VolunteerHistoryProps) {
  const gateway = useVolunteerHistoryGateway();
  const [history, setHistory] = useState<HistoryState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    gateway
      .list(student)
      .then((items) => {
        if (!cancelled) setHistory({ status: "ready", items });
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof AdminUnauthorizedError) {
          redirectToAdminLogin();
          return;
        }
        setHistory({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [gateway, student]);

  return (
    <div className="flex min-h-0 w-full flex-col gap-1.5 pt-3.5 xl:pt-4">
      <p className="text-xs font-medium leading-[14px] text-admin-textMuted xl:text-[13px] xl:leading-4">
        봉사 이력
      </p>
      {history.status === "error" ? (
        <StatusBanner variant="error" message={HISTORY_ERROR_MESSAGE} />
      ) : history.status === "ready" && history.items.length === 0 ? (
        <StatusBanner variant="neutral" message={HISTORY_EMPTY_MESSAGE} />
      ) : history.status === "ready" ? (
        // 이력은 5줄 높이(204px, 컴퓨터 219px)까지만 보이고 넘으면 이 목록만 스크롤한다. 화면이 낮으면 더 줄어든다.
        <div
          data-history-list
          className="flex max-h-[204px] min-h-0 flex-col gap-1.5 overflow-y-auto xl:max-h-[219px]"
        >
          {history.items.map((item) => (
            <div
              key={item.id}
              className="flex w-full items-center gap-2.5 rounded-xl bg-admin-rowSurface px-3 py-2.5 xl:gap-3 xl:px-3.5 xl:py-[11px]"
            >
              <p className="shrink-0 text-xs leading-[14px] text-admin-textMuted xl:text-[13px] xl:leading-4">
                {item.date}
              </p>
              <p className="min-w-0 flex-1 text-[13px] leading-4 text-admin-text xl:text-sm xl:leading-[17px]">
                {item.title}
              </p>
              <p
                className={`shrink-0 text-[13px] font-bold leading-4 xl:text-sm xl:leading-[17px] ${
                  item.delta > 0
                    ? "text-admin-attendance-text"
                    : "text-admin-danger-text"
                }`}
              >
                {item.delta > 0 ? "+" : "−"}
                {Math.abs(item.delta)}회
              </p>
            </div>
          ))}
        </div>
      ) : (
        // 이력을 받는 동안에도 목록이 들어올 높이를 비워 두어, 받은 뒤 다이얼로그가 커지며 위로 움직이지 않게 한다.
        <div
          aria-busy="true"
          className="flex animate-pulse flex-col gap-1.5 motion-reduce:animate-none"
        >
          <span className="sr-only">불러오는 중…</span>
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="h-[38px] rounded-xl bg-admin-rowSurface xl:h-[42px]"
            />
          ))}
        </div>
      )}
    </div>
  );
}
