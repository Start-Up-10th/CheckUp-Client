import { apiFaceGateway } from "./face-gateway";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubRoster(body: unknown[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    ),
  );
}

const STUDENT = {
  studentId: 17,
  name: "김도현",
  studentNumber: 2405,
  dormitoryRoom: 412,
  volunteerCount: 1,
  lastActivityAt: null,
  todayDuty: null,
};

describe("apiFaceGateway.loadStudents", () => {
  it("봉사 명단에서 DataGSM 학생 id별 학번·이름을 만든다", async () => {
    stubRoster([STUDENT]);

    await expect(apiFaceGateway.loadStudents()).resolves.toEqual({
      17: { studentNumber: 2405, name: "김도현" },
    });
  });

  it("학번을 읽을 수 없는 학생은 넣지 않아 `NaN 이름`이 보이지 않게 한다", async () => {
    stubRoster([
      STUDENT,
      { ...STUDENT, studentId: 18, name: "박서연", studentNumber: "x" },
    ]);

    const directory = await apiFaceGateway.loadStudents();

    expect(Object.keys(directory)).toEqual(["17"]);
  });
});
