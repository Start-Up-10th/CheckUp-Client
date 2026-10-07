"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { redirectToAdminLogin } from "@/lib/admin/admin-session";
import { AdminUnauthorizedError } from "@/lib/admin/qr-api";
import {
  useVolunteerGateway,
  type VolunteerGateway,
} from "@/lib/admin/volunteer-gateway";
import { RateLimitedError } from "@/lib/admin/rate-limit";
import { replaceStudent } from "@/lib/admin/volunteer-roster";
import type { RosterStudent } from "@/lib/admin/volunteer-types";

export type RosterStatus = "idle" | "loading" | "ready" | "error";

/** `rateLimited`는 마지막 불러오기가 429(요청이 너무 많음)로 막혀 `error`가 됐는지다. */
type RosterState = {
  roster: RosterStudent[];
  status: RosterStatus;
  rateLimited: boolean;
};

/**
 * 봉사 명단(07)과 당일 봉사자(06)가 같은 명단을 보도록 화면 밖에 둔 저장소다. 화면마다 상태를 따로 두면
 * 07에서 지정한 학생이 06으로 이동하면서 사라진다. 명단은 서버에서 한 번 받아 두 화면이 나눠 쓴다.
 */
const INITIAL: RosterState = { roster: [], status: "idle", rateLimited: false };
let state: RosterState = INITIAL;
let requestId = 0;
/** 진행 중인 새로고침마다, 그동안 성공한 동작이 돌려준 학생 상태. 응답이 오면 그 위에 덮어쓴다. */
const activeOverlays = new Set<Map<number, RosterStudent>>();
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
  emit({ roster: next, status: "ready", rateLimited: false });
}

/**
 * 서버가 돌려준 학생 한 명의 상태만 명단에 넣는다. 진행 중인 명단 새로고침은 버리지 않고, 그 응답이 이 동작보다
 * 먼저 서버를 읽은 낡은 값일 수 있어 응답이 오면 이 학생만 이 상태로 덮어쓴다.
 */
export function updateStudent(updated: RosterStudent): void {
  activeOverlays.forEach((overlay) => overlay.set(updated.id, updated));
  emit({
    roster: replaceStudent(state.roster, updated),
    status: state.status,
    rateLimited: state.rateLimited,
  });
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
  // 이미 보이는 명단은 다시 받는 동안에도, 받지 못했을 때도 그대로 둔다(충돌 뒤 조용한 새로고침).
  const silent = state.status === "ready";
  const overlay = new Map<number, RosterStudent>();
  activeOverlays.add(overlay);
  emit({
    roster: state.roster,
    status: silent ? "ready" : "loading",
    rateLimited: false,
  });
  try {
    const students = await gateway.list();
    if (id === requestId) {
      // 그동안 바뀐 학생이 없으면 응답 배열을 그대로 쓴다.
      const merged =
        overlay.size === 0
          ? students
          : students.map((student) => overlay.get(student.id) ?? student);
      emit({ roster: merged, status: "ready", rateLimited: false });
    }
  } catch (error) {
    if (id !== requestId) return;
    if (error instanceof AdminUnauthorizedError) {
      redirectToAdminLogin();
      return;
    }
    emit({
      roster: state.roster,
      status: silent ? "ready" : "error",
      rateLimited: error instanceof RateLimitedError,
    });
  } finally {
    activeOverlays.delete(overlay);
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
  /** 불러오기 실패가 429(요청이 너무 많음) 때문인지. 화면이 `잠시 후 다시 시도` 안내를 고른다. */
  rateLimited: boolean;
  updateStudent: (updated: RosterStudent) => void;
  reload: () => void;
} {
  const gateway = useVolunteerGateway();
  const { roster, status, rateLimited } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const reload = useCallback(() => void loadRoster(gateway), [gateway]);

  useEffect(() => {
    if (status === "idle") reload();
  }, [status, reload]);

  return { roster, status, rateLimited, updateStudent, reload };
}
