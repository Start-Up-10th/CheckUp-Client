/**
 * 관리자 세션이 끊겼을 때(API 401) 관리자 로그인으로 보낸다(REQ-AUTH-003). 페이지째 이동해
 * 끊긴 세션으로 돌던 타이머·요청이 남지 않게 하고, 뒤로가기로 이 화면에 돌아오지 않게 `replace`한다.
 */
export function redirectToAdminLogin(): void {
  window.location.replace("/admin/login");
}
