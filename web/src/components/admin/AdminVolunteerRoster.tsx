"use client";

import { useMemo, useState } from "react";
import { AdminContentState } from "@/components/admin/AdminContentState";
import { FloorTabs } from "@/components/admin/FloorTabs";
import { ToastLayer, useToast } from "@/components/admin/Toast";
import { VolunteerRosterRow } from "@/components/admin/VolunteerRosterRow";
import type { Floor } from "@/lib/admin/mock-floor-data";
import { operatingDayLabel } from "@/lib/admin/operating-day";
import {
  adjustCount,
  designate,
  groupByRoom,
  type RosterChange,
} from "@/lib/admin/volunteer-roster";
import { useVolunteerRoster } from "@/lib/admin/volunteer-roster-store";

const DEFAULT_FLOOR: Floor = 4;

/** 지정이 막힌 이유별 안내(Figma 07 state messages, 봉사 없음·완료는 하네스 REQ-COM-006 문구). */
const DESIGNATE_REFUSAL: Partial<Record<RosterChange["result"], string>> = {
  "already-designated": "이미 당일 봉사자로 지정된 학생입니다.",
  "already-completed": "이미 봉사를 완료했습니다.",
  "no-count": "봉사가 없습니다.",
};

/**
 * REQ-COM-001: 봉사자 명단 편집(Figma 07). 전체 학생을 층 탭·검색으로 거르고 호실별로 묶어 보여 준다.
 * 명단에 학생을 추가·제외하는 단계는 없다.
 */
export function AdminVolunteerRoster({
  listLoadFailed = false,
}: {
  /** 학생 명단 조회 실패. 실제 조회 연결 전까지 기본은 false다. */
  listLoadFailed?: boolean;
}) {
  const [roster, setRoster] = useVolunteerRoster();
  const [floor, setFloor] = useState<Floor>(DEFAULT_FLOOR);
  const [query, setQuery] = useState("");
  const { toast, showToast } = useToast();

  const groups = useMemo(
    () => groupByRoom(roster, { floor, query }),
    [roster, floor, query],
  );

  function handleAdjustCount(studentId: string, delta: 1 | -1) {
    const change = adjustCount(
      roster,
      studentId,
      delta,
      operatingDayLabel(new Date()),
    );
    if (change.result !== "changed") return;
    setRoster(change.students);
    showToast({ variant: "success", message: "봉사 횟수를 변경했습니다." });
  }

  function handleDesignate(studentId: string) {
    const change = designate(roster, studentId);
    if (change.result === "changed") {
      setRoster(change.students);
      showToast({ variant: "success", message: "당일 봉사자로 지정했습니다." });
      return;
    }
    const refusal = DESIGNATE_REFUSAL[change.result];
    if (refusal) showToast({ variant: "neutral", message: refusal });
  }

  return (
    <div className="flex h-full w-full flex-col gap-3.5 px-4 py-3.5 md:gap-4 md:px-[22px] md:py-6 xl:gap-5 xl:px-8 xl:py-7">
      <ToastLayer toast={toast} placement="below-tabs" variantBorder />

      <div className="flex w-full items-center justify-between md:items-end">
        <div className="flex flex-col gap-0.5 md:gap-1">
          <p className="font-mono text-[10px] leading-[13px] tracking-[1.6px] text-admin-textFaint md:tracking-[1.8px] xl:text-[11px] xl:leading-[15px] xl:tracking-[1.98px]">
            <span className="md:hidden">ADMIN</span>
            <span className="hidden md:inline">VOLUNTEER</span>
          </p>
          <h1 className="text-[22px] font-bold leading-[26px] tracking-[-0.44px] text-admin-text md:text-[26px] md:leading-normal md:tracking-[-0.78px] xl:text-[30px] xl:leading-[36px] xl:tracking-[-0.9px]">
            봉사자 명단 편집
          </h1>
        </div>
        <FloorTabs selected={floor} onSelect={setFloor} />
      </div>

      <label className="flex h-[46px] w-full items-center gap-2.5 rounded-control border border-admin-border bg-admin-rowSurface px-4 md:w-[420px]">
        {/* eslint-disable-next-line @next/next/no-img-element -- Figma 검색 아이콘 원본 SVG */}
        <img
          src="/icons/admin/search.svg"
          alt=""
          aria-hidden="true"
          width={16}
          height={16}
          className="size-4 shrink-0"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="봉사자 검색"
          placeholder="이름, 학번 또는 호실로 검색"
          className="min-w-0 flex-1 bg-transparent text-sm leading-[17px] text-admin-text placeholder:text-admin-textMuted focus:outline-none"
        />
      </label>

      <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto rounded-[16px] bg-admin-surface p-3.5 md:rounded-[18px] md:p-[22px] xl:rounded-panel">
        {listLoadFailed ? (
          <AdminContentState variant="error" onRetry={() => {}} />
        ) : groups.length === 0 ? (
          <p className="py-6 text-center text-sm text-admin-textMuted">
            검색 결과가 없습니다.
          </p>
        ) : (
          <div className="flex flex-col gap-[22px]">
            {groups.map((group) => (
              <section
                key={group.roomNumber}
                aria-label={`${group.roomNumber}호`}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-2 pl-1">
                  <h2 className="text-[15px] font-bold leading-[18px] text-admin-text">
                    {group.roomNumber}호
                  </h2>
                  <p className="font-mono text-xs leading-4 text-admin-textMuted">
                    {group.students.length}명
                  </p>
                </div>
                {group.students.map((student) => (
                  <VolunteerRosterRow
                    key={student.studentId}
                    student={student}
                    onAdjustCount={handleAdjustCount}
                    onDesignate={handleDesignate}
                  />
                ))}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
