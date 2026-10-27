import type { AttendanceActive } from "@/lib/student/attendance-active-api";

/** 받는 중인 용도 이름. 둘 다면 `기숙사·자습실`이다. */
function activePurposes({ dormitory, studyRoom }: AttendanceActive): string {
  return [dormitory && "기숙사", studyRoom && "자습실"]
    .filter(Boolean)
    .join("·");
}

/**
 * 학생 홈의 출석 진행 상태(#357, DEC-106). QR을 찍기 전에 지금 출석을 받는지 알 수 있게 한다.
 * 받는 중이면 출석 카드와 같은 연두색으로 `지금 출석을 받고 있어요 · 기숙사`, 아니면 회색으로
 * `지금은 출석을 받고 있지 않아요`다. 출석은 시간표가 없어(REQ-SCOPE-003) 시간·요일은 보이지 않는다.
 * Figma에 없는 요소라 호실 좌석 카드(RoomSeatCard)의 출석/미출석 색과 점을 따랐다.
 */
export function AttendanceActiveStatus({
  active,
}: {
  active: AttendanceActive;
}) {
  const purposes = activePurposes(active);
  const on = purposes !== "";

  return (
    <p
      role="status"
      className={`flex items-center gap-2 rounded-card border px-4 py-3 text-sm leading-normal ${
        on
          ? "border-admin-attendance-border bg-admin-attendance-bg text-admin-attendance-text"
          : "border-admin-border bg-admin-surface text-admin-textMuted"
      }`}
    >
      <span
        aria-hidden="true"
        className={`size-2 shrink-0 rounded-full ${
          on ? "bg-admin-attendance-text" : "bg-admin-border"
        }`}
      />
      {on ? (
        <span>
          <span className="font-bold">지금 출석을 받고 있어요</span>
          {` · ${purposes}`}
        </span>
      ) : (
        "지금은 출석을 받고 있지 않아요"
      )}
    </p>
  );
}
