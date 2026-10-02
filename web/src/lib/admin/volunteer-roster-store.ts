"use client";

import { useSyncExternalStore } from "react";
import { MOCK_VOLUNTEER_ROSTER } from "@/lib/admin/mock-volunteer-roster";
import type { RosterStudent } from "@/lib/admin/volunteer-types";

/**
 * 봉사 명단(07)과 당일 봉사자(06)가 같은 명단을 보도록 화면 밖에 둔 임시 저장소다. 화면마다 상태를 따로 두면
 * 07에서 지정한 학생이 06으로 이동하면서 사라진다. 서버 봉사 API가 연결되면 이 저장소를 서버 조회로 바꾼다.
 * 새로고침하면 목업 처음 상태로 돌아간다.
 */
let roster: RosterStudent[] = MOCK_VOLUNTEER_ROSTER;
const listeners = new Set<() => void>();

export function getRoster(): RosterStudent[] {
  return roster;
}

export function setRoster(next: RosterStudent[]): void {
  roster = next;
  listeners.forEach((listener) => listener());
}

export function resetRoster(): void {
  setRoster(MOCK_VOLUNTEER_ROSTER);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useVolunteerRoster(): [
  RosterStudent[],
  (next: RosterStudent[]) => void,
] {
  const current = useSyncExternalStore(subscribe, getRoster, getRoster);
  return [current, setRoster];
}
