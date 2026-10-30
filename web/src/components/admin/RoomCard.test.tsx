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

describe("RoomCard 학생 이름", () => {
  it("학생 이름과 출석 여부를 카드에 보인다", () => {
    render(
      <RoomCard
        room={{
          number: "301",
          assigned: 2,
          present: 1,
          students: [
            { studentId: "1", name: "김도현", present: true },
            { studentId: "2", name: "박서연", present: false },
          ],
        }}
      />,
    );

    expect(card()).toHaveTextContent("김도현 출석");
    expect(card()).toHaveTextContent("박서연 미출석");
  });

  it("명단이 없으면 이름 칸을 만들지 않는다", () => {
    render(<RoomCard room={{ number: "302", assigned: 0, present: 0 }} />);

    expect(card()).toHaveTextContent(/^302/);
    expect(card()).not.toHaveTextContent("출석");
  });
});

describe("RoomCard 이름 순서", () => {
  it("호실 상세와 같은 이름순으로 보인다", () => {
    render(
      <RoomCard
        room={{
          number: "303",
          assigned: 2,
          present: 2,
          students: [
            { studentId: "1", name: "최유진", present: true },
            { studentId: "2", name: "강태민", present: true },
          ],
        }}
      />,
    );

    expect(card().textContent).toMatch(/강태민.*최유진/);
  });
});
