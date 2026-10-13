import { describe, expect, it } from "vitest";
import {
  FACE_FLOW_DEFAULT,
  faceFlowDonePath,
  faceFlowQuery,
  parseFaceFlow,
} from "./face-flow";

describe("face-flow", () => {
  it("쿼리에서 다시 등록과 관리자 출발을 읽고 모르는 값은 무시한다", () => {
    expect(parseFaceFlow({})).toEqual(FACE_FLOW_DEFAULT);
    expect(parseFaceFlow({ reset: "1", from: "admin" })).toEqual({
      reset: true,
      fromAdmin: true,
    });
    expect(parseFaceFlow({ reset: "yes", from: "somewhere" })).toEqual(
      FACE_FLOW_DEFAULT,
    );
  });

  it("다음 화면에 이어 붙일 쿼리를 만든다", () => {
    expect(faceFlowQuery(FACE_FLOW_DEFAULT)).toBe("");
    expect(faceFlowQuery({ reset: true, fromAdmin: false })).toBe("?reset=1");
    expect(faceFlowQuery({ reset: false, fromAdmin: true })).toBe(
      "?from=admin",
    );
    expect(faceFlowQuery({ reset: true, fromAdmin: true })).toBe(
      "?reset=1&from=admin",
    );
  });

  it("끝난 뒤 돌아갈 화면은 관리자에서 시작했을 때만 관리자 마이페이지다", () => {
    expect(faceFlowDonePath(FACE_FLOW_DEFAULT)).toBe("/main");
    expect(faceFlowDonePath({ reset: true, fromAdmin: false })).toBe("/main");
    expect(faceFlowDonePath({ reset: false, fromAdmin: true })).toBe(
      "/admin/mypage",
    );
  });
});
