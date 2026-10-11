import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MOCK_VOLUNTEER_ROSTER } from "@/lib/admin/mock-volunteer-roster";
import { AdminVolunteerRoster } from "./AdminVolunteerRoster";
import { StudentDetailDialog } from "./student-management/StudentDetailDialog";
import { StudentSearchField } from "./student-management/StudentSearchField";

vi.mock("@/lib/admin/admin-session", () => ({ redirectToAdminLogin: vi.fn() }));

/**
 * iOS Safari·PWA는 입력칸 글자가 16px보다 작으면 포커스 때 화면을 확대해 휴대폰 화면 밖으로 벗어난다(DEC-068).
 * 터치 기기(`pointer: coarse`)에서는 16px(`text-base`)로 올리고 마우스 기기는 Figma 크기를 그대로 둔다.
 * jsdom은 미디어 쿼리를 계산하지 않아 클래스가 붙어 있는지만 본다.
 */
describe("터치 기기 입력칸 글자 크기(확대 방지)", () => {
  it("봉사자 검색창은 터치 기기에서 16px이다", () => {
    render(<AdminVolunteerRoster />);

    expect(screen.getByLabelText("봉사자 검색")).toHaveClass(
      "[@media(pointer:coarse)]:text-base",
    );
  });

  it("학생 검색창은 터치 기기에서 16px이다", () => {
    render(<StudentSearchField value="" onChange={() => {}} />);

    expect(screen.getByRole("searchbox")).toHaveClass(
      "[@media(pointer:coarse)]:text-base",
    );
  });

  it("학생 상세의 사유 입력칸은 터치 기기에서 16px이다", () => {
    render(
      <StudentDetailDialog
        student={MOCK_VOLUNTEER_ROSTER[0]}
        onClose={() => {}}
        onSave={() => {}}
      />,
    );

    expect(screen.getByPlaceholderText("사유를 입력해 주세요")).toHaveClass(
      "[@media(pointer:coarse)]:text-base",
    );
  });
});
