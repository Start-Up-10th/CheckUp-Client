import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Room } from "@/lib/admin/floor-types";
import { RoomApiError } from "@/lib/admin/room-api";
import { AdminUnauthorizedError } from "@/lib/admin/qr-api";
import { RateLimitedError } from "@/lib/rate-limit";
import {
  type RoomGateway,
  RoomGatewayProvider,
} from "@/lib/admin/room-gateway";
import { createMockRoomGateway } from "@/lib/admin/room-mock-gateway";
import { AdminHomeFloorPlan } from "./AdminHomeFloorPlan";

const redirectToAdminLogin = vi.hoisted(() => vi.fn());
vi.mock("@/lib/admin/admin-session", () => ({ redirectToAdminLogin }));

afterEach(() => {
  cleanup();
  redirectToAdminLogin.mockClear();
});

function renderWith(gateway: RoomGateway = createMockRoomGateway()) {
  return render(
    <RoomGatewayProvider value={gateway}>
      <AdminHomeFloorPlan />
    </RoomGatewayProvider>,
  );
}

/** 기본 층이 3층이라, 401·402호가 있는 4층 탭을 눌러 4층 전개도가 보일 때까지 기다린다. */
async function renderOnFloorFour(
  gateway: RoomGateway = createMockRoomGateway(),
) {
  renderWith(gateway);
  fireEvent.click(await screen.findByRole("button", { name: "4층" }));
  await screen.findByText("4층 전개도");
}

/** 전원 출석인 402호를 열어 수동 수정에서 첫 학생을 미출석으로 바꾼 뒤 저장한다. */
async function changeFirstRoomAndSave() {
  fireEvent.click(await screen.findByRole("button", { name: /^402/ }));
  fireEvent.click(await screen.findByRole("button", { name: "수정" }));
  fireEvent.click(screen.getAllByRole("button", { name: "미출석" })[0]);
  fireEvent.click(screen.getByRole("button", { name: "저장" }));
}

describe("AdminHomeFloorPlan 층 현황", () => {
  it("서버가 준 층 현황을 호실 카드와 출석 합계로 보인다", async () => {
    const gateway = createMockRoomGateway();
    gateway.floor = vi.fn().mockResolvedValue([
      { number: "401", assigned: 4, present: 3 },
      { number: "402", assigned: 3, present: 3 },
    ]);
    await renderOnFloorFour(gateway);

    expect(await screen.findByText("3/4명")).toBeInTheDocument();
    expect(screen.getByText("3/3명")).toBeInTheDocument();
    expect(gateway.floor).toHaveBeenCalledWith(4);
    expect(screen.getByText("4층 전개도")).toBeInTheDocument();
  });

  it("호실이 하나도 없는 층은 빈 상태를 보이고 헤더와 층 탭은 유지한다", async () => {
    const gateway = createMockRoomGateway();
    gateway.floor = vi.fn().mockResolvedValue([]);
    renderWith(gateway);

    expect(await screen.findByText("아직 데이터가 없어요")).toBeInTheDocument();
    expect(screen.getByText("3층 전개도")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "5층" })).toBeInTheDocument();
    expect(
      screen.queryByText("전개도를 불러오지 못했습니다."),
    ).not.toBeInTheDocument();
  });

  it("불러오는 동안은 스켈레톤을 보인다", () => {
    const gateway = createMockRoomGateway();
    gateway.floor = vi.fn(() => new Promise<Room[]>(() => {}));
    renderWith(gateway);

    expect(screen.queryByText("3층 전개도")).not.toBeInTheDocument();
  });

  it("처음에는 3층 전개도를 보인다", async () => {
    const gateway = createMockRoomGateway();
    const floor = vi.spyOn(gateway, "floor");
    renderWith(gateway);

    expect(await screen.findByText("3층 전개도")).toBeInTheDocument();
    expect(floor).toHaveBeenCalledWith(3);
    expect(screen.getByRole("button", { name: "3층" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("층을 바꾸면 그 층 현황을 다시 받는다", async () => {
    const gateway = createMockRoomGateway();
    const floor = vi.spyOn(gateway, "floor");
    renderWith(gateway);
    await screen.findByText("3층 전개도");

    fireEvent.click(screen.getByRole("button", { name: "5층" }));

    expect(await screen.findByText("5층 전개도")).toBeInTheDocument();
    expect(floor).toHaveBeenLastCalledWith(5);
  });

  describe("층을 바꿀 때 깜빡이지 않는다", () => {
    afterEach(() => vi.useRealTimers());

    /** 5층 응답을 직접 풀어 줄 수 있는 게이트웨이. 3·4층은 바로 답한다. */
    function gatewayWithSlowFive() {
      const gateway = createMockRoomGateway();
      const ok = gateway.floor;
      const slow: { release: (rooms: Room[]) => void } = {
        release: () => {},
      };
      gateway.floor = vi.fn((floor) =>
        floor === 5
          ? new Promise<Room[]>((resolve) => {
              slow.release = resolve;
            })
          : ok(floor),
      );
      return { gateway, slow };
    }

    it("새 층이 빨리 오면 스켈레톤을 한 번도 보이지 않고 이전 격자가 한 번에 바뀐다", async () => {
      const { gateway } = gatewayWithSlowFive();
      renderWith(gateway);
      await screen.findByText("3층 전개도");

      // 4층은 바로 온다. 누른 직후에도 격자가 비거나 스켈레톤이 되지 않는다.
      fireEvent.click(screen.getByRole("button", { name: "4층" }));
      expect(document.querySelector("[aria-busy='true']")).toBeNull();
      expect(screen.getByRole("button", { name: /^301/ })).toBeInTheDocument();

      expect(await screen.findByText("4층 전개도")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^401/ })).toBeInTheDocument();
      expect(document.querySelector("[aria-busy='true']")).toBeNull();
    });

    it("새 층이 오기 전에는 이전 층의 제목·합계·격자를 그대로 두고, 오래 걸릴 때만 격자를 스켈레톤으로 바꾼다", async () => {
      const { gateway, slow } = gatewayWithSlowFive();
      renderWith(gateway);
      await screen.findByText("3층 전개도");
      vi.useFakeTimers();

      fireEvent.click(screen.getByRole("button", { name: "5층" }));

      // 누른 직후: 탭만 5층으로 바뀌고 화면은 3층 그대로다.
      expect(screen.getByRole("button", { name: "5층" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(screen.getByText("3층 전개도")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^301/ })).toBeInTheDocument();
      expect(document.querySelector("[aria-busy='true']")).toBeNull();

      // 오래 걸리면 그제서야 격자만 스켈레톤이고 합계는 `–`다.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(400);
      });
      expect(document.querySelector("[aria-busy='true']")).not.toBeNull();
      expect(screen.getAllByText("–")).toHaveLength(2);
      expect(screen.getByRole("button", { name: "4층" })).toBeInTheDocument();

      await act(async () => {
        slow.release([{ number: "501", assigned: 2, present: 2 }]);
      });
      vi.useRealTimers();

      expect(await screen.findByText("5층 전개도")).toBeInTheDocument();
      expect(screen.getByText("2/2명")).toBeInTheDocument();
      expect(document.querySelector("[aria-busy='true']")).toBeNull();
    });

    it("이미 본 층으로 돌아가면 받는 동안에도 그 층을 바로 보인다", async () => {
      const { gateway } = gatewayWithSlowFive();
      renderWith(gateway);
      await screen.findByText("3층 전개도");
      fireEvent.click(screen.getByRole("button", { name: "4층" }));
      await screen.findByText("4층 전개도");

      // 다시 3층을 누르면 받아 둔 3층 격자가 바로 보인다.
      fireEvent.click(screen.getByRole("button", { name: "3층" }));

      expect(screen.getByText("3층 전개도")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^301/ })).toBeInTheDocument();
      expect(document.querySelector("[aria-busy='true']")).toBeNull();
    });

    it("느린 이전 층 응답이 늦게 와도 지금 고른 층 현황을 덮어쓰지 않는다", async () => {
      const { gateway, slow } = gatewayWithSlowFive();
      renderWith(gateway);
      await screen.findByText("3층 전개도");

      // 5층을 누른 뒤 응답이 오기 전에 4층으로 바꾼다.
      fireEvent.click(screen.getByRole("button", { name: "5층" }));
      fireEvent.click(screen.getByRole("button", { name: "4층" }));
      expect(await screen.findByText("4층 전개도")).toBeInTheDocument();

      await act(async () => {
        slow.release([{ number: "501", assigned: 9, present: 9 }]);
      });

      expect(screen.getByText("4층 전개도")).toBeInTheDocument();
      expect(screen.queryByText("9/9명")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^401/ })).toBeInTheDocument();
    });
  });

  it("조회에 실패하면 명세 문구를 보여 주고 다시 시도하면 받아 온다", async () => {
    const gateway = createMockRoomGateway();
    const ok = gateway.floor;
    gateway.floor = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockImplementation(ok);
    renderWith(gateway);

    expect(
      await screen.findByText("전개도를 불러오지 못했습니다."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(
      await screen.findByRole("button", { name: /^301/ }),
    ).toBeInTheDocument();
    expect(gateway.floor).toHaveBeenCalledTimes(2);
  });

  it("조회가 429로 막히면 잠시 후 다시 시도 안내를 보이고 다시 시도하면 받아 온다", async () => {
    const gateway = createMockRoomGateway();
    const ok = gateway.floor;
    gateway.floor = vi
      .fn()
      .mockRejectedValueOnce(new RateLimitedError(2000))
      .mockImplementation(ok);
    renderWith(gateway);

    expect(
      await screen.findByText("잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("전개도를 불러오지 못했습니다."),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(
      await screen.findByRole("button", { name: /^301/ }),
    ).toBeInTheDocument();
  });

  it("로그인이 끊겼으면(401) 관리자 로그인으로 보낸다", async () => {
    const gateway = createMockRoomGateway();
    gateway.floor = vi.fn().mockRejectedValue(new AdminUnauthorizedError());
    renderWith(gateway);

    await waitFor(() => expect(redirectToAdminLogin).toHaveBeenCalledTimes(1));
  });
});

describe("AdminHomeFloorPlan 호실 상세", () => {
  it("호실을 누르면 서버 명단을 받아 상세를 연다", async () => {
    const gateway = createMockRoomGateway();
    const students = vi.spyOn(gateway, "students");
    await renderOnFloorFour(gateway);

    fireEvent.click(await screen.findByRole("button", { name: /^402/ }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(students).toHaveBeenCalledWith("402");
    expect(screen.getByText("402호")).toBeInTheDocument();
  });

  it("상세·수정 다이얼로그는 N인실 대신 배정·출석 인원으로 표기한다", async () => {
    const gateway = createMockRoomGateway();
    gateway.students = vi.fn().mockResolvedValue([
      { studentId: "1", name: "김도현", present: true },
      { studentId: "2", name: "박서연", present: false },
      { studentId: "3", name: "이지후", present: true },
    ]);
    await renderOnFloorFour(gateway);

    fireEvent.click(await screen.findByRole("button", { name: /^402/ }));

    expect(await screen.findByText("배정 3명 · 출석 2명")).toBeInTheDocument();
    expect(screen.queryByText(/인실/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "수정" }));
    fireEvent.click(screen.getAllByRole("button", { name: "출석" })[1]);

    expect(screen.getByText("배정 3명 · 출석 3명")).toBeInTheDocument();
  });

  it("명단 조회가 429로 막히면 잠시 후 다시 시도 안내를 보이고 상세는 열지 않는다", async () => {
    const gateway = createMockRoomGateway();
    gateway.students = vi.fn().mockRejectedValue(new RateLimitedError(2000));
    await renderOnFloorFour(gateway);

    fireEvent.click(await screen.findByRole("button", { name: /^402/ }));

    expect(
      await screen.findByText("잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("명단을 못 받으면 실패 문구를 보이고 상세는 열지 않는다", async () => {
    const gateway = createMockRoomGateway();
    gateway.students = vi.fn().mockRejectedValue(new Error("fail"));
    await renderOnFloorFour(gateway);

    fireEvent.click(await screen.findByRole("button", { name: /^402/ }));

    expect(
      await screen.findByText("호실 명단을 불러오지 못했습니다."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("AdminHomeFloorPlan 호실 수정", () => {
  it("저장하면 바뀐 학생만 서버에 보내고 안내와 카드 인원을 갱신한다", async () => {
    const gateway = createMockRoomGateway();
    const save = vi.spyOn(gateway, "save");
    await renderOnFloorFour(gateway);

    await changeFirstRoomAndSave();

    expect(
      await screen.findByText("출석 상태를 저장했습니다."),
    ).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0][0]).toBe("402");
    expect(save.mock.calls[0][1]).toHaveLength(1);
    expect(save.mock.calls[0][1][0].present).toBe(false);
    expect(screen.getByRole("button", { name: /^402/ })).toHaveTextContent(
      "3/4명",
    );
  });

  it("바꾼 게 없으면 서버에 보내지 않고 안내만 한다", async () => {
    const gateway = createMockRoomGateway();
    const save = vi.spyOn(gateway, "save");
    await renderOnFloorFour(gateway);

    fireEvent.click(await screen.findByRole("button", { name: /^402/ }));
    fireEvent.click(await screen.findByRole("button", { name: "수정" }));
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    expect(
      await screen.findByText("변경된 내용이 없습니다."),
    ).toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
  });

  it("저장이 실패하면 실패 문구를 보이고 다이얼로그를 유지한다", async () => {
    const gateway = createMockRoomGateway();
    gateway.save = vi.fn().mockRejectedValue(new Error("fail"));
    await renderOnFloorFour(gateway);

    await changeFirstRoomAndSave();

    expect(
      await screen.findByText(
        "전개도 변경에 실패했습니다. 다시 시도해 주세요.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByText("출석 상태를 저장했습니다.")).toBeNull();
  });

  it("서버가 호실 학생이 아니라고 하면 다이얼로그를 닫고 현황을 다시 받는다", async () => {
    const gateway = createMockRoomGateway();
    gateway.save = vi
      .fn()
      .mockRejectedValue(new RoomApiError(400, "STUDENT_NOT_IN_ROOM"));
    const floor = vi.spyOn(gateway, "floor");
    await renderOnFloorFour(gateway);

    await changeFirstRoomAndSave();

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    // 처음 3층, 4층 탭, 그리고 호실 학생이 아니라는 응답 뒤 4층을 다시 받는다.
    await waitFor(() => expect(floor).toHaveBeenCalledTimes(3));
    expect(floor).toHaveBeenLastCalledWith(4);
  });

  it("저장이 429로 막히면 잠시 후 다시 시도 안내를 보이고 다이얼로그를 유지한다", async () => {
    const gateway = createMockRoomGateway();
    gateway.save = vi.fn().mockRejectedValue(new RateLimitedError(2000));
    await renderOnFloorFour(gateway);

    await changeFirstRoomAndSave();

    expect(
      await screen.findByText("잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("저장 중 로그인이 끊겼으면(401) 관리자 로그인으로 보낸다", async () => {
    const gateway = createMockRoomGateway();
    gateway.save = vi.fn().mockRejectedValue(new AdminUnauthorizedError());
    await renderOnFloorFour(gateway);

    await changeFirstRoomAndSave();

    await waitFor(() => expect(redirectToAdminLogin).toHaveBeenCalledTimes(1));
  });
});
