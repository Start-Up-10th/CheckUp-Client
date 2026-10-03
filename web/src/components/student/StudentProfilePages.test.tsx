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

/** 본인 정보 응답을 정한다. 읽지 않은 알림은 없음으로 답한다. */
function mockMe(status: number, body?: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (...[url]: [string, RequestInit?]) =>
      url === "/api/v1/auth/me"
        ? new Response(body === undefined ? null : JSON.stringify(body), {
            status,
          })
        : new Response(JSON.stringify({ hasUnread: false })),
    ),
  );
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

  it("받기 전에는 mock 값을 보여 주지 않는다", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    render(<StudentMain />);

    // 같은 호실 명단은 아직 mock이라(서버에 출석 여부 없음) 머리만 본다.
    expect(within(homeHeader()).queryByText(/김도현/)).not.toBeInTheDocument();
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
