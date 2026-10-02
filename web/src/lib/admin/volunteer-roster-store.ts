"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { redirectToAdminLogin } from "@/lib/admin/admin-session";
import { AdminUnauthorizedError } from "@/lib/admin/qr-api";
import {
  useVolunteerGateway,
  type VolunteerGateway,
} from "@/lib/admin/volunteer-gateway";
import type { RosterStudent } from "@/lib/admin/volunteer-types";

export type RosterStatus = "idle" | "loading" | "ready" | "error";

type RosterState = { roster: RosterStudent[]; status: RosterStatus };

/**
 * 봉사 명단(07)과 당일 봉사자(06)가 같은 명단을 보도록 화면 밖에 둔 저장소다. 화면마다 상태를 따로 두면
 * 07에서 지정한 학생이 06으로 이동하면서 사라진다. 명단은 서버에서 한 번 받아 두 화면이 나눠 쓴다.
 */
const INITIAL: RosterState = { roster: [], status: "idle" };
let state: RosterState = INITIAL;
let requestId = 0;
const listeners = new Set<() => void>();

function emit(next: RosterState): void {
  state = next;
  listeners.forEach((listener) => listener());
}

export function getRoster(): RosterStudent[] {
  return state.roster;
}

/** 명단을 직접 바꾼다. 불러오기를 마친 상태(`ready`)가 된다. */
export function setRoster(next: RosterStudent[]): void {
  requestId += 1;
  emit({ roster: next, status: "ready" });
}

/** 처음 상태(명단 없음, 아직 불러오지 않음)로 되돌린다. */
export function resetRoster(): void {
  requestId += 1;
  emit(INITIAL);
}

/**
 * 서버에서 명단을 받는다. 401이면 관리자 로그인으로 보내고, 그 밖의 실패는 `error` 상태로 두어 화면이 다시
 * 시도할 수 있게 한다. 더 늦게 시작한 요청이 있으면 먼저 시작한 요청의 결과는 버린다.
 */
export async function loadRoster(gateway: VolunteerGateway): Promise<void> {
  const id = ++requestId;
  // 이미 보이는 명단은 다시 받는 동안에도 그대로 둔다(충돌 뒤 조용한 새로고침).
  emit({
    roster: state.roster,
    status: state.status === "ready" ? "ready" : "loading",
  });
  try {
    const students = await gateway.list();
    if (id === requestId) emit({ roster: students, status: "ready" });
  } catch (error) {
    if (id !== requestId) return;
    if (error instanceof AdminUnauthorizedError) {
      redirectToAdminLogin();
      return;
    }
    emit({ roster: state.roster, status: "error" });
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): RosterState {
  return state;
}

function getServerSnapshot(): RosterState {
  return INITIAL;
}

/** 명단과 불러오기 상태. 아직 불러오지 않았으면 처음 쓰는 화면이 서버에서 받는다. */
export function useVolunteerRoster(): {
  roster: RosterStudent[];
  status: RosterStatus;
  setRoster: (next: RosterStudent[]) => void;
  reload: () => void;
} {
  const gateway = useVolunteerGateway();
  const { roster, status } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const reload = useCallback(() => void loadRoster(gateway), [gateway]);

  useEffect(() => {
    if (status === "idle") reload();
  }, [status, reload]);

  return { roster, status, setRoster, reload };
}
