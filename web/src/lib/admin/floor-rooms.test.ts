import { describe, expect, it } from "vitest";
import { floorRoomNumbers, withAllRooms } from "./floor-rooms";

describe("floorRoomNumbers", () => {
  it("층별 호실 번호 목록이다(Figma 전개도 기준)", () => {
    const three = floorRoomNumbers(3);
    const four = floorRoomNumbers(4);
    const five = floorRoomNumbers(5);

    expect([three[0], three.at(-1), three.length]).toEqual(["301", "320", 20]);
    expect([four[0], four.at(-1), four.length]).toEqual(["401", "421", 21]);
    expect([five[0], five.at(-1), five.length]).toEqual(["501", "518", 18]);
  });
});

describe("withAllRooms", () => {
  it("서버가 호실을 하나도 주지 않아도 모든 호실이 0/0으로 보인다", () => {
    const rooms = withAllRooms(5, []);

    expect(rooms).toHaveLength(18);
    expect(rooms[0]).toEqual({ number: "501", assigned: 0, present: 0 });
    expect(
      rooms.every((room) => room.assigned === 0 && room.present === 0),
    ).toBe(true);
  });

  it("서버가 준 호실은 그 값을 쓰고 나머지만 0/0으로 채운다", () => {
    const rooms = withAllRooms(3, [
      { number: "308", assigned: 2, present: 2 },
      { number: "301", assigned: 4, present: 1 },
    ]);

    expect(rooms).toHaveLength(20);
    expect(rooms.find((room) => room.number === "308")).toEqual({
      number: "308",
      assigned: 2,
      present: 2,
    });
    expect(rooms.find((room) => room.number === "301")).toEqual({
      number: "301",
      assigned: 4,
      present: 1,
    });
    expect(rooms.find((room) => room.number === "302")).toEqual({
      number: "302",
      assigned: 0,
      present: 0,
    });
  });

  it("호실 번호 오름차순이다", () => {
    const numbers = withAllRooms(4, [
      { number: "410", assigned: 1, present: 0 },
    ]).map((room) => room.number);

    expect(numbers).toEqual([...numbers].sort((a, b) => Number(a) - Number(b)));
  });

  it("목록에 없는 호실을 서버가 주면 버리지 않고 함께 둔다", () => {
    const rooms = withAllRooms(3, [{ number: "322", assigned: 1, present: 1 }]);

    expect(rooms).toHaveLength(21);
    expect(rooms.at(-1)).toEqual({ number: "322", assigned: 1, present: 1 });
  });
});
