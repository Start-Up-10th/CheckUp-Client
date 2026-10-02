import type { FaceResult } from "@/lib/admin/face-api";
import type { FaceGateway, StudentDirectory } from "@/lib/admin/face-gateway";

const DEMO_STUDENTS: StudentDirectory = {
  101: { studentNumber: 2405, name: "김도현" },
  102: { studentNumber: 2412, name: "박서연" },
  103: { studentNumber: 2401, name: "정민수" },
};

function known(studentId: number): FaceResult {
  return {
    trackId: `k${studentId}`,
    status: "KNOWN",
    studentId,
    attendance: "RECORDED",
    attempts: 1,
    qrRecommended: false,
  };
}

function unknown(trackId: string, attempts: number): FaceResult {
  return {
    trackId,
    status: "UNKNOWN",
    attempts,
    qrRecommended: attempts > 3,
  };
}

/** 확인용 페이지가 돌려주는 프레임 순서. 성공 → 실패 → 한 프레임에 성공·실패 → QR 안내까지의 실패 누적이다. */
const DEMO_FRAMES: FaceResult[][] = [
  [],
  [known(101)],
  [unknown("a", 1)],
  [known(102), unknown("b", 1)],
  [unknown("a", 2)],
  [unknown("a", 3)],
  [unknown("a", 4)],
  [known(103)],
];

/**
 * 서버 대신 정해진 프레임 순서를 돌려주는 얼굴 게이트웨이다. 로그인·카메라 서버 없이 화면을 보는 확인용 페이지와
 * 화면 테스트가 쓴다. 호출한 프레임 수를 돌며 반복한다.
 */
export function createMockFaceGateway(
  frames: FaceResult[][] = DEMO_FRAMES,
  students: StudentDirectory = DEMO_STUDENTS,
): FaceGateway {
  let sessions = 0;
  let sent = 0;
  return {
    createSession: async () => `mock-session-${(sessions += 1)}`,
    closeSession: () => {},
    sendFrame: async (_sessionId, _frame, frameId) => {
      const faces = frames[sent % frames.length];
      sent += 1;
      return { frameId, faces };
    },
    loadStudents: async () => students,
  };
}
