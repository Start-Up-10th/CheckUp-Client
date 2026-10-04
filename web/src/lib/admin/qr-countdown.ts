/**
 * 남은 시간을 `MM:SS`로 쓴다(REQ-ATT-004의 QR 만료 카운트다운). 이미 지났으면 `00:00`이고,
 * 1초 미만은 올려 `00:01`로 둬 아직 남았음을 보여 준다.
 */
export function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
