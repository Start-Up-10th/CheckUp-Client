/**
 * 얼굴 촬영 화면 아래 알약 모양 안내(REQ-FACE-001). 6px 점 + 13px 문구.
 * 진행 중(카운트다운 "3초 후 자동으로 촬영합니다" 4:29, "촬영 중이에요" 692:18)은 회색 바탕에 라임 점,
 * 완료("촬영이 완료되었어요" 692:37)는 연두 바탕에 진초록 점·글씨다.
 * 단계가 바뀔 때 화면 낭독기가 읽도록 `role="status"`를 둔다.
 */
export function FaceCaptureStatus({
  message,
  done,
}: {
  message: string;
  done: boolean;
}) {
  return (
    <div
      role="status"
      className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] leading-normal ${
        done
          ? "bg-admin-attendance-bg text-admin-attendance-text"
          : "bg-admin-ghost-bg text-admin-ghost-text"
      }`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 shrink-0 rounded-full ${
          done ? "bg-admin-attendance-text" : "bg-admin-accent-bg"
        }`}
      />
      {message}
    </div>
  );
}
