import type { RosterStudent } from "./mock-volunteer-roster";
import {
  adjustCount,
  cancelDuty,
  completeDuty,
  designate,
  designatedToday,
  floorOf,
  groupByRoom,
  lastActivityKorean,
  matchesQuery,
} from "./volunteer-roster";

function student(overrides: Partial<RosterStudent>): RosterStudent {
  return {
    studentId: "2405",
    name: "김도현",
    roomNumber: 412,
    count: 2,
    duty: "none",
    ...overrides,
  };
}

describe("floorOf", () => {
  it("호실 번호의 백의 자리가 층이다", () => {
    expect(floorOf(412)).toBe(4);
    expect(floorOf(301)).toBe(3);
  });
});

describe("matchesQuery", () => {
  const kim = student({});

  it("빈 검색어는 모두 찾는다", () => {
    expect(matchesQuery(kim, "")).toBe(true);
    expect(matchesQuery(kim, "   ")).toBe(true);
  });

  it("숫자는 호실 번호나 학번이 정확히 같을 때만 찾는다", () => {
    expect(matchesQuery(kim, "412")).toBe(true);
    expect(matchesQuery(kim, "2405")).toBe(true);
    expect(matchesQuery(kim, "41")).toBe(false);
    expect(matchesQuery(kim, "240")).toBe(false);
  });

  it("이름은 포함되면 찾는다", () => {
    expect(matchesQuery(kim, "도현")).toBe(true);
    expect(matchesQuery(kim, "김")).toBe(true);
    expect(matchesQuery(kim, "박")).toBe(false);
  });

  it("초성만 입력하면 이름의 초성과 맞춘다", () => {
    expect(matchesQuery(kim, "ㄱㄷㅎ")).toBe(true);
    expect(matchesQuery(kim, "ㄷㅎ")).toBe(true);
    expect(matchesQuery(kim, "ㅂㅅㅇ")).toBe(false);
  });
});

describe("groupByRoom", () => {
  const roster = [
    student({ studentId: "2", name: "박서연", roomNumber: 413 }),
    student({ studentId: "1", name: "정민수", roomNumber: 412 }),
    student({ studentId: "3", name: "김도현", roomNumber: 412 }),
    student({ studentId: "4", name: "백도윤", roomNumber: 301 }),
  ];

  it("고른 층만 호실 순으로 묶고 같은 호실 안은 이름순이다", () => {
    const groups = groupByRoom(roster, { floor: 4, query: "" });

    expect(groups.map((g) => g.roomNumber)).toEqual([412, 413]);
    expect(groups[0].students.map((s) => s.name)).toEqual(["김도현", "정민수"]);
  });

  it("동명이인은 학번으로 안정 정렬한다", () => {
    const groups = groupByRoom(
      [
        student({ studentId: "2406", name: "김도현", roomNumber: 412 }),
        student({ studentId: "2405", name: "김도현", roomNumber: 412 }),
      ],
      { floor: 4, query: "" },
    );

    expect(groups[0].students.map((s) => s.studentId)).toEqual([
      "2405",
      "2406",
    ]);
  });

  it("검색어가 있으면 맞는 학생이 있는 호실만 남는다", () => {
    const groups = groupByRoom(roster, { floor: 4, query: "박서연" });

    expect(groups).toHaveLength(1);
    expect(groups[0].roomNumber).toBe(413);
  });

  it("결과가 없으면 빈 배열이다", () => {
    expect(groupByRoom(roster, { floor: 5, query: "" })).toEqual([]);
  });
});

describe("designatedToday", () => {
  it("지정됐고 아직 완료하지 않은 학생만 호실 순으로 돌려준다", () => {
    const list = designatedToday([
      student({
        studentId: "1",
        name: "가",
        roomNumber: 414,
        duty: "designated",
      }),
      student({
        studentId: "2",
        name: "나",
        roomNumber: 412,
        duty: "designated",
      }),
      student({
        studentId: "3",
        name: "다",
        roomNumber: 412,
        duty: "completed",
      }),
      student({ studentId: "4", name: "라", roomNumber: 412, duty: "none" }),
    ]);

    expect(list.map((s) => s.studentId)).toEqual(["2", "1"]);
  });
});

describe("adjustCount", () => {
  it("+는 1 늘리고 조정 날짜를 남긴다", () => {
    const { students, result } = adjustCount(
      [student({ count: 1 })],
      "2405",
      1,
      "10/02",
    );

    expect(result).toBe("changed");
    expect(students[0]).toMatchObject({ count: 2, lastActivityDate: "10/02" });
  });

  it("−는 1 줄인다", () => {
    const { students } = adjustCount(
      [student({ count: 2 })],
      "2405",
      -1,
      "10/02",
    );

    expect(students[0].count).toBe(1);
  });

  it("0에서 −는 바꾸지 않는다", () => {
    const input = [student({ count: 0 })];

    const { students, result } = adjustCount(input, "2405", -1, "10/02");

    expect(result).toBe("at-minimum");
    expect(students).toBe(input);
  });

  it("없는 학생은 not-found다", () => {
    expect(adjustCount([student({})], "9999", 1, "10/02").result).toBe(
      "not-found",
    );
  });
});

describe("designate", () => {
  it("횟수가 1 이상이면 지정하고 횟수는 그대로다", () => {
    const { students, result } = designate([student({ count: 2 })], "2405");

    expect(result).toBe("changed");
    expect(students[0]).toMatchObject({ duty: "designated", count: 2 });
  });

  it("횟수가 0이면 지정하지 않는다", () => {
    expect(designate([student({ count: 0 })], "2405").result).toBe("no-count");
  });

  it("이미 지정된 학생은 중복 지정하지 않는다", () => {
    expect(designate([student({ duty: "designated" })], "2405").result).toBe(
      "already-designated",
    );
  });

  it("이미 완료한 학생은 다시 지정하지 않는다", () => {
    expect(designate([student({ duty: "completed" })], "2405").result).toBe(
      "already-completed",
    );
  });
});

describe("cancelDuty", () => {
  it("지정을 취소하고 횟수는 바꾸지 않는다", () => {
    const { students, result } = cancelDuty(
      [student({ duty: "designated", count: 2 })],
      "2405",
    );

    expect(result).toBe("changed");
    expect(students[0]).toMatchObject({ duty: "none", count: 2 });
  });

  it("완료한 지정은 취소할 수 없다", () => {
    expect(cancelDuty([student({ duty: "completed" })], "2405").result).toBe(
      "already-completed",
    );
  });

  it("지정되지 않은 학생은 취소할 것이 없다", () => {
    expect(cancelDuty([student({})], "2405").result).toBe("not-designated");
  });
});

describe("completeDuty", () => {
  it("완료로 바꾸고 횟수를 1 줄이며 날짜를 남긴다", () => {
    const { students, result } = completeDuty(
      [student({ duty: "designated", count: 2 })],
      "2405",
      "10/02",
    );

    expect(result).toBe("changed");
    expect(students[0]).toMatchObject({
      duty: "completed",
      count: 1,
      lastActivityDate: "10/02",
    });
  });

  it("두 번 눌러도 한 번만 반영한다", () => {
    const first = completeDuty(
      [student({ duty: "designated", count: 2 })],
      "2405",
      "10/02",
    );

    const second = completeDuty(first.students, "2405", "10/02");

    expect(second.result).toBe("already-completed");
    expect(second.students[0].count).toBe(1);
  });

  it("지정되지 않은 학생은 완료할 수 없다", () => {
    expect(completeDuty([student({})], "2405", "10/02").result).toBe(
      "not-designated",
    );
  });
});

describe("lastActivityKorean", () => {
  it("MM/DD를 N월 D일로 바꾸고 앞의 0을 뗀다", () => {
    expect(lastActivityKorean("10/01")).toBe("10월 1일");
    expect(lastActivityKorean("09/28")).toBe("9월 28일");
  });

  it("활동이 없으면 -다", () => {
    expect(lastActivityKorean(undefined)).toBe("-");
  });

  it("모양이 다르면 그대로 돌려준다", () => {
    expect(lastActivityKorean("어제")).toBe("어제");
  });
});
