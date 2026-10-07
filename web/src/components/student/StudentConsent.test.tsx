import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StudentConsent } from "./StudentConsent";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function mockFetch(status: number) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function agreeAll() {
  fireEvent.click(screen.getByText("전체 동의"));
  fireEvent.click(screen.getByRole("button", { name: "동의하고 계속하기" }));
}

afterEach(() => {
  push.mockReset();
  vi.unstubAllGlobals();
});

describe("StudentConsent", () => {
  it("필수 두 항목을 켜기 전에는 버튼이 꺼져 있다", () => {
    render(<StudentConsent />);

    expect(
      screen.getByRole("button", { name: "동의하고 계속하기" }),
    ).toBeDisabled();
  });

  it("저장에 성공하면 선택한 항목을 보내고 얼굴 등록으로 간다", async () => {
    const fetchMock = mockFetch(204);
    render(<StudentConsent />);

    agreeAll();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/face"));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      privacy: true,
      face: true,
      noticeAlarm: true,
    });
  });

  it("로그인이 안 돼 있으면 로그인 화면으로 간다", async () => {
    mockFetch(401);
    render(<StudentConsent />);

    agreeAll();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
  });

  it("저장이 429로 막히면 잠시 후 다시 시도 안내를 보여 주고 다시 누를 수 있다", async () => {
    mockFetch(429);
    render(<StudentConsent />);

    agreeAll();

    expect(
      await screen.findByText("잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("서버와 연결이 원활하지 않습니다."),
    ).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "동의하고 계속하기" }),
    ).toBeEnabled();
  });

  it("저장에 실패하면 오류 문구를 보여 주고 다시 누를 수 있다", async () => {
    mockFetch(500);
    render(<StudentConsent />);

    agreeAll();

    expect(
      await screen.findByText("서버와 연결이 원활하지 않습니다."),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "동의하고 계속하기" }),
    ).toBeEnabled();
  });

  it("학생이 아닌 계정(403)이면 학생 전용 문구를 보여 주고 다시 누를 수 없다", async () => {
    mockFetch(403);
    render(<StudentConsent />);

    agreeAll();

    expect(
      await screen.findByText("학생 계정만 이용할 수 있어요."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("서버와 연결이 원활하지 않습니다."),
    ).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "동의하고 계속하기" }),
    ).toBeDisabled();
  });
});
