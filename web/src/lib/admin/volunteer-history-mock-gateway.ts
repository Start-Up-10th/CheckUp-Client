import type { VolunteerHistoryGateway } from "@/lib/admin/volunteer-history-gateway";

/**
 * Figma 예시 값을 모든 학생에게 똑같이 보여 주는 목업이다. 로그인 없이 보는 확인용 페이지와 화면 테스트가 쓰고 운영
 * 화면에는 쓰지 않는다.
 */
export function createMockVolunteerHistoryGateway(): VolunteerHistoryGateway {
  return {
    list: async () => [
      { id: "10/01", date: "10/01", title: "도서관 정리 봉사", delta: 1 },
      { id: "09/24", date: "09/24", title: "생활관 규정 위반", delta: -1 },
      { id: "09/17", date: "09/17", title: "급식실 봉사", delta: 1 },
      { id: "09/03", date: "09/03", title: "교내 청소", delta: 1 },
    ],
  };
}
