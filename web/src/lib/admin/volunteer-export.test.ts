import type { VolunteerAdjustment } from "@/lib/admin/volunteer-api";
import {
  buildVolunteerHistoryCsv,
  collectVolunteerHistory,
  EXPORT_HISTORY_LIMIT,
  formatKstDateTime,
} from "@/lib/admin/volunteer-export";
import type { RosterStudent } from "@/lib/admin/volunteer-types";

function student(over: Partial<RosterStudent>): RosterStudent {
  return {
    id: 1,
    studentId: "2101",
    name: "홍길동",
    roomNumber: 301,
    count: 0,
    duty: "none",
    ...over,
  };
}

function item(over: Partial<VolunteerAdjustment>): VolunteerAdjustment {
  return { id: "x", date: "-", title: "-", delta: 1, ...over };
}

function lines(csv: string) {
  return csv.replace(/^﻿/, "").trimEnd().split("\r\n");
}

describe("formatKstDateTime", () => {
  it("UTC 시각을 한국 시간 YYYY-MM-DD HH:mm으로 바꾸고 없으면 빈칸이다", () => {
    expect(formatKstDateTime("2026-10-02T05:30:00Z")).toBe("2026-10-02 14:30");
    expect(formatKstDateTime("2026-10-01T15:00:00Z")).toBe("2026-10-02 00:00");
    expect(formatKstDateTime(undefined)).toBe("");
    expect(formatKstDateTime("x")).toBe("");
  });
});

describe("buildVolunteerHistoryCsv", () => {
  it("학생별로 묶어 첫 줄에만 정보·합계를 쓰고 위반은 아래로 내려 쓴다", () => {
    const csv = buildVolunteerHistoryCsv([
      {
        student: student({ id: 2, studentId: "2102", name: "김철수" }),
        history: [],
      },
      {
        student: student({ count: 1, consecutiveCount: 1 }),
        history: [
          item({
            delta: 2,
            reason: "점호 불참",
            kind: "ADMIN",
            createdAt: "2026-10-02T05:30:00Z",
          }),
          item({ delta: -1, kind: "DUTY_COMPLETION" }),
          item({ delta: -1, kind: "CONSECUTIVE_COMPLETION" }),
          item({ delta: -1, kind: "ADMIN", reason: "감면" }),
          item({
            delta: 3,
            kind: "DUTY_MISSED",
            createdAt: "2026-09-17T00:10:00Z",
          }),
        ],
      },
    ]);

    expect(csv.startsWith("﻿")).toBe(true);
    expect(lines(csv)).toEqual([
      "이름,학번,호실,받은 횟수,한 횟수,남은 횟수,일시,위반 사항,횟수",
      "홍길동,2101,301,5,2,2,2026-10-02 14:30,점호 불참,2",
      ",,,,,,2026-09-17 09:10,사유 없음,3",
      "김철수,2102,301,0,0,0,,,",
    ]);
  });

  it("호실 → 학번 순이고 호실이 없는 학생은 맨 뒤다", () => {
    const csv = buildVolunteerHistoryCsv([
      {
        student: student({ studentId: "3001", name: "다", roomNumber: null }),
        history: [],
      },
      {
        student: student({ studentId: "2202", name: "나", roomNumber: 412 }),
        history: [],
      },
      {
        student: student({ studentId: "2201", name: "가", roomNumber: 412 }),
        history: [],
      },
    ]);
    expect(
      lines(csv)
        .slice(1)
        .map((line) => line.split(",")[0]),
    ).toEqual(["가", "나", "다"]);
  });

  it("수식으로 시작하는 사유는 '를 붙이고 쉼표·따옴표는 감싼다", () => {
    const csv = buildVolunteerHistoryCsv([
      {
        student: student({}),
        history: [
          item({ reason: '=HYPERLINK("x")' }),
          item({ reason: '소등, "무단" 외출' }),
        ],
      },
    ]);
    const rows = lines(csv);
    expect(rows[1]).toContain(`"'=HYPERLINK(""x"")"`);
    expect(rows[2]).toContain(`"소등, ""무단"" 외출"`);
  });
});

describe("collectVolunteerHistory", () => {
  it("모든 학생의 이력을 최대 건수로 받아 명단 순서대로 돌려준다", async () => {
    const roster = Array.from({ length: 10 }, (_, i) => student({ id: i }));
    const list = vi.fn(async (s: RosterStudent) => [
      item({ id: String(s.id) }),
    ]);

    const result = await collectVolunteerHistory(roster, { list });

    expect(list).toHaveBeenCalledTimes(10);
    expect(list).toHaveBeenCalledWith(roster[3], EXPORT_HISTORY_LIMIT);
    expect(result.map((r) => r.history[0].id)).toEqual(
      roster.map((s) => String(s.id)),
    );
  });

  it("하나라도 실패하면 오류를 던진다", async () => {
    const list = vi.fn(async (s: RosterStudent) => {
      if (s.id === 2) throw new Error("boom");
      return [];
    });
    await expect(
      collectVolunteerHistory([student({ id: 1 }), student({ id: 2 })], {
        list,
      }),
    ).rejects.toThrow("boom");
  });
});
