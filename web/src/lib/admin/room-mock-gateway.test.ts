import { describe, expect, it } from "vitest";
import { RoomApiError } from "./room-api";
import { createMockRoomGateway } from "./room-mock-gateway";

describe("createMockRoomGateway", () => {
  it("층별 호실 수와 호실 번호 순서를 돌려준다", async () => {
    const gateway = createMockRoomGateway();

    const rooms = await gateway.floor(4);

    expect(rooms).toHaveLength(21);
    expect(rooms[0].number).toBe("401");
    expect(rooms.every((room) => room.assigned >= 1)).toBe(true);
  });

  it("저장하면 이후 호실 명단과 층 현황에 반영된다", async () => {
    const gateway = createMockRoomGateway();
    const before = (await gateway.floor(4))[1];
    const students = await gateway.students("402");
    const target = students.find((student) => student.present)!;

    await gateway.save("402", [
      { studentId: target.studentId, present: false },
    ]);

    const after = (await gateway.floor(4))[1];
    expect(after.present).toBe(before.present - 1);
    expect(
      (await gateway.students("402")).find(
        (student) => student.studentId === target.studentId,
      )?.present,
    ).toBe(false);
  });

  it("호실 학생이 아닌 학생을 저장하면 STUDENT_NOT_IN_ROOM 오류다", async () => {
    const gateway = createMockRoomGateway();

    await expect(
      gateway.save("402", [{ studentId: "99999", present: true }]),
    ).rejects.toMatchObject({
      status: 400,
      code: "STUDENT_NOT_IN_ROOM",
    } satisfies Partial<RoomApiError>);
  });
});
