import {
  ConsentLoginRequiredError,
  ConsentNotStudentError,
  submitConsent,
} from "./consent-api";

const CHOICES = { privacy: true, face: true, noticeAlarm: false };

function mockFetch(status: number) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("submitConsent", () => {
  it("동의 항목을 세션 쿠키와 함께 POST로 보낸다(학생 ID는 보내지 않는다)", async () => {
    const fetchMock = mockFetch(204);

    await submitConsent(CHOICES);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/consent");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("include");
    expect(JSON.parse(init.body)).toEqual(CHOICES);
  });

  it("204면 성공", async () => {
    mockFetch(204);

    await expect(submitConsent(CHOICES)).resolves.toBeUndefined();
  });

  it("로그인하지 않았으면(401) 로그인 필요 오류", async () => {
    mockFetch(401);

    await expect(submitConsent(CHOICES)).rejects.toBeInstanceOf(
      ConsentLoginRequiredError,
    );
  });

  it("학생이 아니면(403) 학생 아님 오류", async () => {
    mockFetch(403);

    await expect(submitConsent(CHOICES)).rejects.toBeInstanceOf(
      ConsentNotStudentError,
    );
  });

  it.each([400, 500])("%i는 일반 오류", async (status) => {
    mockFetch(status);

    await expect(submitConsent(CHOICES)).rejects.toThrow(`consent: ${status}`);
  });
});
