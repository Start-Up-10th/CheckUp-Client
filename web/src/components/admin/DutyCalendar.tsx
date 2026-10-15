"use client";

import { useEffect, useState } from "react";
import type { DutyRecord } from "@/lib/admin/volunteer-types";
import { roomLabel } from "@/lib/admin/volunteer-roster";

type DutyCalendarProps = {
  /** 오늘 운영일 `YYYY-MM-DD`. 이후 날짜는 고를 수 없다. */
  todayKey: string;
  /** 지금 보고 있는 날 `YYYY-MM-DD`. */
  selectedKey: string;
  onSelect: (key: string) => void;
  /** 그 달의 미이행 날짜별 인원. 없으면(서버 지원 전) 점을 찍지 않는다. */
  loadMonth?: (year: number, month: number) => Promise<Record<string, number>>;
  /** 고른 날의 미이행 기록. 아직 받는 중이면 null이다. */
  missed: DutyRecord[] | null;
  /** 미이행 학생을 눌렀을 때. 호출한 쪽이 조정 다이얼로그를 연다. */
  onPickMissed: (record: DutyRecord) => void;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function dayKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseKey(key: string): { y: number; m: number; d: number } {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d };
}

/**
 * 봉사자 관리에서 날짜별 당일 봉사자 기록을 확인하는 달력(#334). 버튼에는 지금 보는 날의 `YYYY.MM.DD`가 보이고,
 * 처음에는 오늘 운영일이다. 눌러서 연 달력은 그 날이 속한 달을 보이고 달 이동·연월 선택으로 바꿀 수 있다.
 * 미이행이 있는 날은 빨간 점이고, 날짜를 누르면 달력 아래에 그날 안 한 학생이 나온다.
 */
export function DutyCalendar({
  todayKey,
  selectedKey,
  onSelect,
  loadMonth,
  missed,
  onPickMissed,
}: DutyCalendarProps) {
  const today = parseKey(todayKey);
  const selected = parseKey(selectedKey);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState({ y: selected.y, m: selected.m });
  const [picking, setPicking] = useState(false);
  const [marks, setMarks] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!open || !loadMonth) return;
    let cancelled = false;
    loadMonth(view.y, view.m)
      .then((next) => {
        if (!cancelled) setMarks(next);
      })
      .catch(() => {
        if (!cancelled) setMarks({});
      });
    return () => {
      cancelled = true;
    };
  }, [open, view, loadMonth]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function toggle() {
    if (!open) {
      setView({ y: selected.y, m: selected.m });
      setPicking(false);
    }
    setOpen((value) => !value);
  }

  function move(delta: number) {
    const index = view.y * 12 + (view.m - 1) + delta;
    setView({ y: Math.floor(index / 12), m: (index % 12) + 1 });
  }

  const isFutureMonth = (year: number, month: number) =>
    year > today.y || (year === today.y && month > today.m);
  const first = new Date(Date.UTC(view.y, view.m - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(view.y, view.m, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array<null>(first).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const label = `${selected.y}.${String(selected.m).padStart(2, "0")}.${String(selected.d).padStart(2, "0")}`;
  const arrow =
    "flex size-8 items-center justify-center rounded-lg text-admin-textMuted transition-colors hover:bg-admin-rowSurface disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div>
      <button
        type="button"
        aria-label={`날짜 선택, 지금 ${label}`}
        aria-expanded={open}
        onClick={toggle}
        className="flex items-center gap-1.5 rounded-[10px] bg-admin-surface px-3 py-2 text-xs font-bold leading-[14px] text-admin-text shadow-[inset_0_0_0_1px_rgb(var(--admin-border))] transition-colors hover:bg-admin-rowSurface md:text-[13px] md:leading-4 xl:px-3.5 xl:py-[9px]"
      >
        <span className="font-mono">{label}</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="달력 닫기"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div
            role="dialog"
            aria-label="날짜 선택"
            className="absolute right-0 top-full z-20 mt-2 w-[min(300px,calc(100vw-32px))] rounded-2xl bg-admin-surface p-3 shadow-[0_8px_32px_rgba(0,0,0,0.16)] ring-1 ring-admin-border max-h-[calc(100dvh-180px)] overflow-y-auto overscroll-contain md:w-[340px] md:p-4 xl:max-h-[calc(100dvh-200px)] xl:w-[420px] xl:p-5"
          >
            {picking && (
              <div className="flex items-center justify-between pb-1">
                <button
                  type="button"
                  aria-label="이전 해"
                  onClick={() => setView((v) => ({ ...v, y: v.y - 1 }))}
                  className={arrow}
                >
                  ‹
                </button>
                <span className="text-[13px] font-bold text-admin-text md:text-sm xl:text-base">
                  {view.y}년
                </span>
                <button
                  type="button"
                  aria-label="다음 해"
                  disabled={view.y >= today.y}
                  onClick={() => setView((v) => ({ ...v, y: v.y + 1 }))}
                  className={arrow}
                >
                  ›
                </button>
              </div>
            )}
            <div className="flex items-center justify-between pb-2">
              <button
                type="button"
                aria-label="이전 달"
                onClick={() => move(-1)}
                className={arrow}
              >
                ‹
              </button>
              <button
                type="button"
                aria-expanded={picking}
                onClick={() => setPicking((value) => !value)}
                className="rounded-lg px-2 py-1 text-[13px] font-bold text-admin-text transition-colors hover:bg-admin-rowSurface md:text-sm xl:text-base"
              >
                {view.y}년 {view.m}월{" "}
                <span className="text-admin-textFaint">▾</span>
              </button>
              <button
                type="button"
                aria-label="다음 달"
                disabled={isFutureMonth(
                  view.m === 12 ? view.y + 1 : view.y,
                  view.m === 12 ? 1 : view.m + 1,
                )}
                onClick={() => move(1)}
                className={arrow}
              >
                ›
              </button>
            </div>

            {picking ? (
              <div className="grid grid-cols-4 gap-1.5">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <button
                    key={month}
                    type="button"
                    disabled={isFutureMonth(view.y, month)}
                    onClick={() => {
                      setView((v) => ({ ...v, m: month }));
                      setPicking(false);
                    }}
                    className={`h-9 rounded-lg text-xs transition-colors disabled:opacity-30 md:h-10 md:text-[13px] xl:h-11 xl:text-sm ${
                      month === view.m
                        ? "bg-admin-accent-bg font-bold text-admin-accent-text"
                        : "text-admin-text hover:bg-admin-rowSurface"
                    }`}
                  >
                    {month}월
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] text-admin-textMuted md:gap-1 md:text-[11px] xl:text-xs">
                  {WEEKDAYS.map((weekday) => (
                    <span key={weekday} className="py-1">
                      {weekday}
                    </span>
                  ))}
                  {cells.map((day, index) => {
                    if (day === null) return <span key={`blank-${index}`} />;
                    const key = dayKey(view.y, view.m, day);
                    const future = key > todayKey;
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-label={`${view.y}년 ${view.m}월 ${day}일${marks[key] ? `, 미이행 ${marks[key]}명` : ""}`}
                        aria-pressed={key === selectedKey}
                        disabled={future}
                        onClick={() => onSelect(key)}
                        className={`relative flex h-8 items-center justify-center rounded-lg text-xs transition-colors disabled:opacity-40 md:h-9 md:text-[13px] xl:h-11 xl:text-sm ${
                          key === selectedKey
                            ? "bg-admin-accent-bg font-bold text-admin-accent-text"
                            : "text-admin-text hover:bg-admin-rowSurface disabled:hover:bg-transparent"
                        }`}
                      >
                        {day}
                        {marks[key] ? (
                          <span
                            aria-hidden="true"
                            className="absolute bottom-1 size-1.5 rounded-full bg-admin-danger-text"
                          />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                <p className="pt-3 text-[10px] text-admin-textMuted md:text-[11px] xl:text-xs">
                  <span
                    aria-hidden="true"
                    className="mr-1 inline-block size-1.5 rounded-full bg-admin-danger-text align-middle"
                  />
                  미이행이 있는 날
                </p>

                {(loadMonth || selectedKey === todayKey) && (
                  <div className="mt-3 flex flex-col gap-1.5 border-t border-admin-divider pt-3">
                    <p className="text-xs font-bold text-admin-text md:text-[13px] xl:text-sm">
                      {selectedKey === todayKey
                        ? "오늘 미이행"
                        : `${selected.y}년 ${selected.m}월 ${selected.d}일 미이행`}
                      {missed && (
                        <span className="ml-1.5 font-mono text-xs font-normal text-admin-textMuted">
                          {missed.length}명
                        </span>
                      )}
                    </p>
                    {missed === null ? (
                      <p className="py-2 text-xs text-admin-textMuted">
                        불러오는 중…
                      </p>
                    ) : missed.length === 0 ? (
                      <p className="py-2 text-xs text-admin-textMuted">
                        미이행한 학생이 없습니다.
                      </p>
                    ) : (
                      missed.map((record) => (
                        <button
                          key={record.studentId}
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            onPickMissed(record);
                          }}
                          className="flex w-full items-center justify-between gap-3 rounded-xl bg-admin-rowSurface px-2.5 py-2 text-left transition-colors hover:bg-admin-divider md:px-3 md:py-2.5 xl:px-4 xl:py-3"
                        >
                          <span className="flex items-baseline gap-2">
                            <span className="text-xs font-bold text-admin-text md:text-[13px] xl:text-sm">
                              {record.name}
                            </span>
                            <span className="font-mono text-[10px] text-admin-textMuted md:text-[11px] xl:text-xs">
                              {record.studentId} ·{" "}
                              {roomLabel(record.roomNumber)}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-bold leading-[14px] ${
                                record.adjusted
                                  ? "bg-admin-attendance-bg text-admin-attendance-text"
                                  : "bg-admin-danger-bg text-admin-danger-text"
                              }`}
                            >
                              {record.adjusted ? "횟수 처리됨" : "미이행"}
                            </span>
                            <span
                              aria-hidden="true"
                              className="text-admin-textFaint"
                            >
                              ›
                            </span>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
