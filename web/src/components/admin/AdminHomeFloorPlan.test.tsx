import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminHomeFloorPlan } from "./AdminHomeFloorPlan";

afterEach(cleanup);

/** 전원 출석인 402호를 열어 수동 수정에서 첫 학생을 미출석으로 바꾼 뒤 저장한다. */
function changeFirstRoomAndSave() {
  fireEvent.click(screen.getByRole("button", { name: /^402/ }));
  fireEvent.click(screen.getByRole("button", { name: "수정" }));
  fireEvent.click(screen.getAllByRole("button", { name: "미출석" })[0]);
  fireEvent.click(screen.getByRole("button", { name: "저장" }));
}

describe("AdminHomeFloorPlan 실패 안내", () => {
  it("전개도 조회에 실패하면 명세 문구를 보여 준다", () => {
    render(<AdminHomeFloorPlan loadFailed />);

    expect(
      screen.getByText("전개도를 불러오지 못했습니다."),
    ).toBeInTheDocument();
  });

  it("조회에 실패하지 않으면 실패 문구를 보여 주지 않는다", () => {
    render(<AdminHomeFloorPlan />);

    expect(
      screen.queryByText("전개도를 불러오지 못했습니다."),
    ).not.toBeInTheDocument();
  });

  it("호실 저장이 실패하면 실패 문구를 보여 주고 다이얼로그를 유지한다", async () => {
    const saveRoom = vi.fn().mockRejectedValue(new Error("fail"));
    render(<AdminHomeFloorPlan saveRoom={saveRoom} />);

    changeFirstRoomAndSave();

    expect(
      await screen.findByText(
        "전개도 변경에 실패했습니다. 다시 시도해 주세요.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByText("출석 상태를 저장했습니다.")).toBeNull();
  });

  it("호실 저장이 성공하면 저장 안내를 보여 주고 다이얼로그를 닫는다", async () => {
    const saveRoom = vi.fn().mockResolvedValue(undefined);
    render(<AdminHomeFloorPlan saveRoom={saveRoom} />);

    changeFirstRoomAndSave();

    expect(
      await screen.findByText("출석 상태를 저장했습니다."),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(saveRoom).toHaveBeenCalledTimes(1);
  });
});
