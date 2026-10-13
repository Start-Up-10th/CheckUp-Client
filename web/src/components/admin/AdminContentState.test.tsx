import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminContentState } from "@/components/admin/AdminContentState";

// 상태 아이콘 SVG는 검은 선이라 다크 모드에서는 흰색으로 뒤집어 보여야 한다(학생 상태 화면과 같다).
describe("AdminContentState 아이콘", () => {
  it("빈 상태·오류·로그인 필요 모두 다크 모드에서 흰색으로 뒤집는다", () => {
    const variants = [
      <AdminContentState key="empty" variant="empty" />,
      <AdminContentState key="error" variant="error" onRetry={() => {}} />,
      <AdminContentState key="auth" variant="auth" />,
    ];
    for (const element of variants) {
      const { container, unmount } = render(element);
      const icon = container.querySelector("img");
      expect(icon).not.toBeNull();
      expect(icon?.className).toContain("dark:invert");
      unmount();
    }
  });
});
