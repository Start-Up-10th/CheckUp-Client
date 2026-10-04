import { render, screen, waitFor, within } from "@testing-library/react";
import { StudentMain } from "./StudentMain";
import { StudentMyPage } from "./StudentMyPage";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => {
  const router = { replace, push: vi.fn() };
  return { useRouter: () => router, usePathname: () => "/main" };
});
vi.mock("next/font/google", () => ({
  Roboto_Mono: () => ({ className: "mono" }),
}));

const STUDENT = {
  studentId: 1234,
  grade: 2,
  classNumber: 4,
  number: 5,
  studentNumber: 2405,
  dormitoryRoom: 412,
  dormitoryFloor: 4,
};

const ROSTER = [
  {
    student_name: "홍길동",
    student_class: 4,
    student_number: 2405,
    attended: true,
  },
  {
    student_name: "고길동",
    student_class: 4,
    student_number: 2412,
    attended: false,
  },
];

type Reply = { status: number; body?: unknown };

const FACE_ENROLLED = {
  status: "REGISTERED",
  consented: true,
  eligible: true,
  enrolled: true,
};
const toResponse = ({ status, body }: Reply) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

/** 본인 정보·호실 명단 응답을 정한다. 읽지 않은 알림은 없음으로 답한다. */
function mockMe(
  status: number,
  body?: unknown,
  roster: Reply | "pending" = { status: 200, body: ROSTER },
  face: Reply = { status: 200, body: FACE_ENROLLED },
) {
  const fetchMock = vi.fn(async (...[url]: [string, RequestInit?]) => {
    if (url === "/api/v1/auth/me") return toResponse({ status, body });
    if (url === "/api/v1/face/me") return toResponse(face);
    if (url.startsWith("/api/v1/room/student")) {
      return roster === "pending"
        ? new Promise<Response>(() => {})
        : toResponse(roster);
    }
    return new Response(JSON.stringify({ hasUnread: false }));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const me = (student: unknown = STUDENT) => ({
  name: "홍길동",
  role: "STUDENT",
  consented: true,
  student,
});

/** 핸드폰 홈 머리(사이드바 프로필과 구분해서 찾는다) */
const homeHeader = () => screen.getByRole("banner");

afterEach(() => {
  replace.mockReset();
  vi.unstubAllGlobals();
});

describe("StudentMain 본인 정보", () => {
  it("머리에 서버의 학번·이름·층을, 카드에 층·호실을 보여 준다", async () => {
    mockMe(200, me());
    render(<StudentMain />);

    expect(
      await within(homeHeader()).findByText("2405 · 홍길동"),
    ).toBeInTheDocument();
    expect(within(homeHeader()).getByText("기숙사 4층")).toBeInTheDocument();
    const card = screen.getByRole("region", { name: "내 호실" });
    expect(within(card).getByText("기숙사 4층")).toBeInTheDocument();
    expect(within(card).getByText("412")).toBeInTheDocument();
  });

  it("본인 호실 명단과 오늘 기숙사 입소 출석을 이름순으로 보여 준다", async () => {
    const fetchMock = mockMe(200, me());
    render(<StudentMain />);

    const card = screen.getByRole("region", { name: "내 호실" });
    expect(
      await within(card).findByText("2인실 · 1명 출석"),
    ).toBeInTheDocument();
    // 이름순 번호: 고길동 1번(미출석), 홍길동 2번(출석)
    expect(card).toHaveTextContent("고길동1번 · 미출석");
    expect(card).toHaveTextContent("홍길동2번 · 출석");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/room/student?dormitoryRoom=412&purpose=DORMITORY",
      { credentials: "include" },
    );
  });

  it("명단을 받기 전에는 인원 줄을 비워 둔다", async () => {
    mockMe(200, me(), "pending");
    render(<StudentMain />);

    const card = screen.getByRole("region", { name: "내 호실" });
    expect(await within(card).findByText("412")).toBeInTheDocument();
    expect(within(card).queryByText(/인실/)).not.toBeInTheDocument();
  });

  it("명단을 받지 못하면 서버 오류 문구를 보여 준다", async () => {
    mockMe(200, me(), { status: 500 });
    render(<StudentMain />);

    expect(
      await screen.findByText("서버와 연결이 원활하지 않습니다."),
    ).toBeInTheDocument();
  });

  it("받기 전에는 mock 값을 보여 주지 않는다", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    render(<StudentMain />);

    expect(screen.queryByText(/김도현/)).not.toBeInTheDocument();
    expect(within(homeHeader()).queryByText(/·/)).not.toBeInTheDocument();
    expect(within(homeHeader()).queryByText(/기숙사/)).not.toBeInTheDocument();
  });

  it("호실이 배정되지 않았으면 빈 상태를 보여 준다", async () => {
    mockMe(200, me({ ...STUDENT, dormitoryRoom: null, dormitoryFloor: null }));
    render(<StudentMain />);

    expect(await screen.findByText("배정된 호실이 없어요")).toBeInTheDocument();
    expect(within(homeHeader()).getByText("기숙사")).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "내 호실" }),
    ).not.toBeInTheDocument();
  });

  it("학생 정보가 없는 계정이면 학생 전용 안내", async () => {
    mockMe(200, me(null));
    render(<StudentMain />);

    expect(
      await screen.findByText("학생 계정만 이용할 수 있어요"),
    ).toBeInTheDocument();
  });

  it("로그인하지 않았으면 로그인 화면으로 간다", async () => {
    mockMe(401);
    render(<StudentMain />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("받지 못하면 서버 오류 문구를 보여 준다", async () => {
    mockMe(500);
    render(<StudentMain />);

    expect(
      await screen.findByText("서버와 연결이 원활하지 않습니다."),
    ).toBeInTheDocument();
  });
});

describe("StudentMain 얼굴 등록 확인", () => {
  const faceCalls = (fetchMock: ReturnType<typeof mockMe>) =>
    fetchMock.mock.calls.filter(([url]) => url === "/api/v1/face/me");

  it("얼굴을 등록하지 않은 학생은 얼굴 등록 화면으로 보낸다", async () => {
    mockMe(200, me(), undefined, {
      status: 200,
      body: { ...FACE_ENROLLED, status: "NOT_REGISTERED", enrolled: false },
    });
    render(<StudentMain />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/face"));
  });

  it("이미 등록한 학생은 홈에 머문다", async () => {
    const fetchMock = mockMe(200, me());
    render(<StudentMain />);

    await waitFor(() => expect(faceCalls(fetchMock)).toHaveLength(1));
    await screen.findByText("2인실 · 1명 출석");

    expect(replace).not.toHaveBeenCalled();
  });

  it("등록 대상이 아니면(호실 미배정 등) 등록하지 않았어도 보내지 않는다", async () => {
    const fetchMock = mockMe(200, me(), undefined, {
      status: 200,
      body: { ...FACE_ENROLLED, eligible: false, enrolled: false },
    });
    render(<StudentMain />);

    await waitFor(() => expect(faceCalls(fetchMock)).toHaveLength(1));
    await screen.findByText("2인실 · 1명 출석");

    expect(replace).not.toHaveBeenCalled();
  });

  it("등록 상태 조회가 실패하면 홈을 막지 않는다", async () => {
    const fetchMock = mockMe(200, me(), undefined, { status: 500 });
    render(<StudentMain />);

    await waitFor(() => expect(faceCalls(fetchMock)).toHaveLength(1));
    await screen.findByText("2인실 · 1명 출석");

    expect(replace).not.toHaveBeenCalled();
  });

  it("학생 정보가 없는 계정은 얼굴 등록 상태를 묻지 않는다", async () => {
    const fetchMock = mockMe(200, me(null));
    render(<StudentMain />);

    await screen.findByText("학생 계정만 이용할 수 있어요");

    expect(faceCalls(fetchMock)).toHaveLength(0);
  });
});

describe("StudentMyPage 본인 정보", () => {
  it("서버의 이름과 학번·층·호실을 보여 준다", async () => {
    mockMe(200, me());
    render(<StudentMyPage />);

    const main = screen.getByRole("main");
    expect(await within(main).findByText("홍길동")).toBeInTheDocument();
    expect(
      within(main).getByText("2405 · 기숙사 4층 412호"),
    ).toBeInTheDocument();
  });

  it("호실이 배정되지 않았으면 호실 미배정", async () => {
    mockMe(200, me({ ...STUDENT, dormitoryRoom: null, dormitoryFloor: null }));
    render(<StudentMyPage />);

    expect(
      await within(screen.getByRole("main")).findByText("2405 · 호실 미배정"),
    ).toBeInTheDocument();
  });

  it("로그인하지 않았으면 로그인 화면으로 간다", async () => {
    mockMe(401);
    render(<StudentMyPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  });

  it("받지 못하면 정보를 불러오지 못했다고 알린다", async () => {
    mockMe(500);
    render(<StudentMyPage />);

    expect(
      await screen.findByText("정보를 불러오지 못했습니다."),
    ).toBeInTheDocument();
  });
});
