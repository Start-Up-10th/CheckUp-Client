"use client";

import { useEffect, useId, useState } from "react";
import { StatusBanner } from "@/components/admin/StatusBanner";
import {
  useVolunteerHistoryGateway,
  type VolunteerHistoryItem,
} from "@/lib/admin/volunteer-history-gateway";
import { roomLabel } from "@/lib/admin/volunteer-roster";
import type { RosterStudent } from "@/lib/admin/volunteer-types";

type VolunteerStudentDialogProps = {
  student: RosterStudent;
  onClose: () => void;
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
 * Figma 07 봉사자 명단 편집의 학생 상세 다이얼로그. 학생 이름·`학번 · 호실`, 남은 봉사 횟수, 봉사 이력 목록과 닫기만
 * 있고 횟수를 바꾸는 조작은 없다(학생 관리에서 한다). 너비는 핸드폰 310·패드 400·컴퓨터 460이다.
 */
export function VolunteerStudentDialog({
  student,
  onClose,
}: VolunteerStudentDialogProps) {
  const gateway = useVolunteerHistoryGateway();
  const [history, setHistory] = useState<HistoryState>({ status: "loading" });
  const titleId = useId();

  useEffect(() => {
    let cancelled = false;
    gateway
      .list(student)
      .then((items) => {
        if (!cancelled) setHistory({ status: "ready", items });
      })
      .catch(() => {
        if (!cancelled) setHistory({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [gateway, student]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#1c1c1e]/45"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex w-[310px] max-w-[calc(100vw-32px)] flex-col gap-1 rounded-2xl bg-admin-surface p-[18px] md:w-[400px] md:p-5 xl:w-[460px] xl:p-[22px]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id={titleId}
          className="text-lg font-bold leading-[22px] text-admin-text md:text-[19px] md:leading-[23px] xl:text-xl xl:leading-6"
        >
          {student.name}
        </h2>
        <p className="text-[13px] leading-4 text-admin-textMuted xl:text-sm xl:leading-[17px]">
          {student.studentId} · {roomLabel(student.roomNumber)}
        </p>

        <div className="flex w-full items-center justify-between rounded-card border border-admin-attendance-border bg-admin-attendance-bg px-4 py-3 text-admin-attendance-text xl:px-[18px] xl:py-3.5">
          <p className="text-[13px] font-medium leading-4 xl:text-sm xl:leading-[17px]">
            남은 봉사 횟수
          </p>
          <p className="text-[19px] font-bold leading-[23px] md:text-xl md:leading-6 xl:text-[22px] xl:leading-[26px]">
            {student.count}회
          </p>
        </div>

        <div className="flex w-full flex-col gap-1.5 pt-3.5 xl:pt-4">
          <p className="text-xs font-medium leading-[14px] text-admin-textMuted xl:text-[13px] xl:leading-4">
            봉사 이력
          </p>
          {history.status === "error" ? (
            <StatusBanner variant="error" message={HISTORY_ERROR_MESSAGE} />
          ) : history.status === "ready" && history.items.length === 0 ? (
            <StatusBanner variant="neutral" message={HISTORY_EMPTY_MESSAGE} />
          ) : history.status === "ready" ? (
            history.items.map((item) => (
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
                  {item.delta > 0 ? "+1회" : "−1회"}
                </p>
              </div>
            ))
          ) : null}
        </div>

        <div className="flex w-full items-start justify-end pt-3 xl:pt-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[13px] bg-admin-ghost-bg px-5 py-3 text-[13px] font-bold leading-4 text-admin-ghost-text xl:px-[22px] xl:py-[13px] xl:text-sm xl:leading-[17px]"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
