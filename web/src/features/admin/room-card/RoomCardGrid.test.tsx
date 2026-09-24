import { render, screen, within } from "@testing-library/react";
import type { Room } from "@/lib/admin/mock-floor-data";
import { RoomCardGrid } from "./RoomCardGrid";

function room(number: string, presence: boolean[]): Room {
  return {
    number,
    students: presence.map((present, index) => ({
      studentId: `${number}-${index + 1}`,
      name: `학생${index + 1}`,
      present,
    })),
  };
}

describe("RoomCardGrid", () => {
  it("카드마다 호실 번호와 출석/배정 인원을 표시한다", () => {
    render(
      <RoomCardGrid
        rooms={[
          room("401", [true, true, true, true]),
          room("402", [true, false, true]),
          room("403", [true, true]),
        ]}
      />,
    );

    const card401 = screen.getByRole("button", { name: /401/ });
    expect(within(card401).getByText("4/4명")).toBeInTheDocument();
    // 분모는 4명 고정이 아니라 배정 인원이다.
    const card402 = screen.getByRole("button", { name: /402/ });
    expect(within(card402).getByText("2/3명")).toBeInTheDocument();
    const card403 = screen.getByRole("button", { name: /403/ });
    expect(within(card403).getByText("2/2명")).toBeInTheDocument();
  });

  it("전원 출석과 일부 미출석을 다른 상태로 구분한다", () => {
    render(
      <RoomCardGrid
        rooms={[room("401", [true, true, true, true]), room("402", [false])]}
      />,
    );

    expect(screen.getByRole("button", { name: /401/ })).toHaveAttribute(
      "data-status",
      "present",
    );
    expect(screen.getByRole("button", { name: /402/ })).toHaveAttribute(
      "data-status",
      "absent",
    );
  });

  it("출석 / 미출석 범례만 두고 공실 범례는 두지 않는다", () => {
    render(<RoomCardGrid rooms={[]} />);

    const legend = screen.getByRole("list", { name: "범례" });
    const labels = within(legend)
      .getAllByRole("listitem")
      .map((item) => item.textContent);
    expect(labels).toEqual(["출석", "미출석"]);
    expect(screen.queryByText("공실")).not.toBeInTheDocument();
  });
});
