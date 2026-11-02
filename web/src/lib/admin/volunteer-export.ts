import type { VolunteerAdjustment } from "@/lib/admin/volunteer-api";
import type { VolunteerHistoryGateway } from "@/lib/admin/volunteer-history-gateway";
import type { RosterStudent } from "@/lib/admin/volunteer-types";

/** 서버 이력 API가 한 번에 주는 최대 건수(1~100). */
export const EXPORT_HISTORY_LIMIT = 100;
/** 학생별 이력을 동시에 받는 수. */
const CONCURRENCY = 6;

const HEADER = [
  "이름",
  "학번",
  "호실",
  "받은 횟수",
  "한 횟수",
  "남은 횟수",
  "일시",
  "위반 사항",
  "횟수",
];

const KST = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** ISO 시각을 한국 시간 `YYYY-MM-DD HH:mm`으로. 읽을 수 없으면 빈칸. */
export function formatKstDateTime(iso: string | undefined): string {
  const date = iso ? new Date(iso) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  const part = Object.fromEntries(
    KST.formatToParts(date).map((p) => [p.type, p.value]),
  );
  return `${part.year}-${part.month}-${part.day} ${part.hour}:${part.minute}`;
}

/** CSV 한 칸. 엑셀이 수식으로 실행하지 않게 `= + - @`로 시작하는 글자 앞에 `'`를 붙인다. */
function cell(value: string | number): string {
  if (typeof value === "number") return String(value);
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export type StudentHistory = {
  student: RosterStudent;
  history: VolunteerAdjustment[];
};

/**
 * #409 봉사 이력 엑셀. 학생별로 묶어 학생 정보·합계는 첫 줄에만 쓰고 위반(횟수가 늘어난 기록)은 아래로 한 줄씩
 * 내려 쓴다. 받은 횟수는 늘어난 기록의 합, 한 횟수는 완료 기록의 수, 남은 횟수는 서버의 지금 값(일반 + 연속)이다.
 * 엑셀이 한글을 깨뜨리지 않게 BOM을 붙인다.
 */
export function buildVolunteerHistoryCsv(entries: StudentHistory[]): string {
  const sorted = [...entries].sort(
    (a, b) =>
      (a.student.roomNumber ?? Infinity) - (b.student.roomNumber ?? Infinity) ||
      a.student.studentId.localeCompare(b.student.studentId),
  );
  const rows: (string | number)[][] = [HEADER];
  for (const { student, history } of sorted) {
    const violations = history.filter((item) => item.delta > 0);
    const received = violations.reduce((sum, item) => sum + item.delta, 0);
    const done = history.filter(
      (item) =>
        item.kind === "DUTY_COMPLETION" ||
        item.kind === "CONSECUTIVE_COMPLETION",
    ).length;
    const remaining = student.count + (student.consecutiveCount ?? 0);
    const info = [
      student.name,
      student.studentId,
      student.roomNumber ?? "",
      received,
      done,
      remaining,
    ];
    const blank = info.map(() => "");
    if (violations.length === 0) rows.push([...info, "", "", ""]);
    violations.forEach((item, index) => {
      rows.push([
        ...(index === 0 ? info : blank),
        formatKstDateTime(item.createdAt),
        item.reason ?? "사유 없음",
        item.delta,
      ]);
    });
  }
  return `﻿${rows.map((row) => row.map(cell).join(",")).join("\r\n")}\r\n`;
}

/** 전체 학생의 이력을 몇 명씩 동시에 받는다. 하나라도 실패하면 그 오류를 던진다. */
export async function collectVolunteerHistory(
  roster: RosterStudent[],
  gateway: VolunteerHistoryGateway,
): Promise<StudentHistory[]> {
  const result: StudentHistory[] = new Array(roster.length);
  let next = 0;
  async function worker() {
    while (next < roster.length) {
      const index = next++;
      const student = roster[index];
      result[index] = {
        student,
        history: await gateway.list(student, EXPORT_HISTORY_LIMIT),
      };
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, roster.length) }, worker),
  );
  return result;
}

/** CSV를 `봉사이력_YYYY-MM-DD.csv`로 내려받게 한다. */
export function downloadCsv(csv: string, now = new Date()): void {
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `봉사이력_${formatKstDateTime(now.toISOString()).slice(0, 10)}.csv`;
  link.click();
  // 바로 해제하면 일부 브라우저(Firefox)가 내려받기를 시작하기 전에 주소를 잃는다.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
