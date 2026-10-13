/**
 * 얼굴 등록 흐름(동의 `/consent` → 촬영 `/face`)이 어디서 시작됐는지와 끝난 뒤 어디로 돌아갈지(REQ-FACE-001).
 * 주소 쿼리로 화면 사이에 전달한다. 값은 화면 이동에만 쓰고 권한 판정에는 쓰지 않는다(서버가 판정한다).
 * - `reset`: 이미 등록한 계정이 다시 등록한다. 촬영 화면이 홈으로 돌려보내지 않는다.
 * - `from=admin`: 관리자 마이페이지에서 시작했다. 끝나면 학생 홈이 아니라 관리자 마이페이지로 돌아온다.
 */
export type FaceFlow = {
  reset: boolean;
  fromAdmin: boolean;
};

/** 관리자 출발 흐름이 끝났을 때 돌아가는 주소. */
export const ADMIN_MYPAGE_FACE_DONE = "/admin/mypage?face=done";

export const FACE_FLOW_DEFAULT: FaceFlow = { reset: false, fromAdmin: false };

/** 서버 컴포넌트의 `searchParams`에서 흐름을 읽는다. 모르는 값은 무시한다. */
export function parseFaceFlow(params: {
  reset?: string;
  from?: string;
}): FaceFlow {
  return { reset: params.reset === "1", fromAdmin: params.from === "admin" };
}

/** 다음 화면 주소에 이어 붙일 쿼리. 흐름이 기본이면 빈 문자열이다. */
export function faceFlowQuery(flow: FaceFlow): string {
  const parts: string[] = [];
  if (flow.reset) parts.push("reset=1");
  if (flow.fromAdmin) parts.push("from=admin");
  return parts.length > 0 ? `?${parts.join("&")}` : "";
}

/**
 * 얼굴 등록을 마치거나 이미 등록돼 있을 때 돌아갈 화면. 관리자 마이페이지에는 `?face=done`을 달아 마친 것을
 * 한 번 알리게 한다(마이페이지가 보인 뒤 주소에서 지운다).
 */
export function faceFlowDonePath(flow: FaceFlow): string {
  return flow.fromAdmin ? ADMIN_MYPAGE_FACE_DONE : "/main";
}
