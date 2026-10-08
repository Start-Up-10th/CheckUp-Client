import { render, screen } from "@testing-library/react";
import { RoomCard } from "./RoomCard";

const card = () => screen.getByRole("button");

describe("RoomCard 색", () => {
  it("전원 출석은 라임 계열이다", () => {
    render(<RoomCard room={{ number: "401", assigned: 4, present: 4 }} />);

    expect(card()).toHaveClass("border-admin-attendance-border");
  });

  it("일부 미출석은 회색 계열이다", () => {
    render(<RoomCard room={{ number: "402", assigned: 4, present: 3 }} />);

    expect(card()).toHaveClass("border-admin-absence-border");
  });

  it("등록했지만 아무도 출석하지 않았으면 회색 계열이다", () => {
    render(<RoomCard room={{ number: "403", assigned: 1, present: 0 }} />);

    expect(card()).toHaveClass("border-admin-absence-border");
  });

  it("등록한 학생이 없는 호실(0/0)은 전원 출석이 아니라 회색 계열이다", () => {
    render(<RoomCard room={{ number: "404", assigned: 0, present: 0 }} />);

    expect(card()).toHaveClass("border-admin-absence-border");
    expect(card()).not.toHaveClass("border-admin-attendance-border");
  });
});
