"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusBanner } from "@/components/admin/StatusBanner";
import { useCurrentStudent } from "@/lib/student/current-student";
import { fetchFaceStatus } from "@/lib/student/face-enroll-api";
import {
  RoomLoginRequiredError,
  fetchMyRoomMates,
} from "@/lib/student/room-roster-api";
import { MainHeader } from "./MainHeader";
import { MyRoomCard } from "./MyRoomCard";
import type { RoomMate } from "./RoomMap";
import { QrFab } from "./QrFab";
import { StudentEmptyState } from "./StudentEmptyState";
import { StudentShell } from "./StudentShell";
import { RATE_LIMIT_MESSAGE, RateLimitedError } from "@/lib/rate-limit";

export type MainLoadStatus = "ready" | "error";

/**
 * 학생 홈(REQ-UI-003). 핸드폰(Figma 5:2)은 흰 헤더 아래 `내 호실` 카드가 하단 탭 위까지 차고,
 * 오른쪽 아래 QR 버튼. 노트북(224:2)은 사이드바 오른쪽 가운데 폭 720px·안쪽 여백 36px에 머리와 카드.
 * 얼굴 미등록이면 얼굴 등록(/face)으로 보낸다. 서버 실패는 `서버와 연결이 원활하지 않습니다.`
 * (Figma state messages 205:263 — 관리자 StatusBanner error와 같은 모양이라 재사용).
 * 메인 토스트 프레임이 Figma에서 지워져 위치는 이전 프레임 값을 따르되, 핸드폰은 QR 버튼과 겹치지
 * 않게 그 위(아래 176px)에 둔다. 노트북은 이전 프레임대로 오른쪽 위 32px, 폭 380px.
 * "지금은 출석 인증을 받고 있지 않습니다."는 QR 결과 문구라 여기서는 쓰지 않는다.
 *
 * 머리의 학번·이름·층과 카드의 층·호실은 공통 틀이 서버에서 받은 본인 정보(`/api/v1/auth/me`)다. 로그인하지
 * 않았으면 로그인 화면으로 보낸다. 같은 호실 학생 명단과 오늘 출석 여부는 본인 호실 번호로 서버에서 받는다
 * (`/api/v1/room/student`, 기숙사 입소 출석 — 사용자 결정 2026-10-04). 받기 전에는 인원 줄과 배치 그림 안을
 * 비워 두고, 받지 못하면 서버 오류 문구를 보인다. 호실이 배정되지 않았거나 학생이 아닌 계정은 Figma에 없어
 * 공통 빈 상태로 알린다.
 */
export function StudentMain({
  initialStatus = "ready",
}: {
  initialStatus?: MainLoadStatus;
}) {
  return (
    <StudentShell>
      <StudentMainContent initialStatus={initialStatus} />
    </StudentShell>
  );
}

type RosterState =
  | { status: "loading" }
  | { status: "ready"; mates: RoomMate[] }
  | { status: "error"; rateLimited?: boolean };

/** 공통 틀 안에서 본인 정보를 꺼내 쓰는 홈 본문. */
function StudentMainContent({
  initialStatus,
}: {
  initialStatus: MainLoadStatus;
}) {
  const router = useRouter();
  const current = useCurrentStudent();
  const profile = current.status === "ready" ? current.profile : null;
  const roomNumber = profile?.roomNumber ?? null;
  const [roster, setRoster] = useState<RosterState>({ status: "loading" });

  useEffect(() => {
    if (roomNumber === null) return;
    let cancelled = false;
    fetchMyRoomMates(roomNumber)
      .then((mates) => {
        if (!cancelled) setRoster({ status: "ready", mates });
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        if (reason instanceof RoomLoginRequiredError) router.replace("/login");
        else {
          setRoster({
            status: "error",
            rateLimited: reason instanceof RateLimitedError,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [roomNumber, router]);

  useEffect(() => {
    if (current.status === "unauthenticated") router.replace("/login");
  }, [current.status, router]);

  // REQ-UI-003: 본인 정보를 받은 학생이 얼굴을 등록하지 않았으면 얼굴 등록으로 보낸다(`GET /api/v1/face/me`).
  // 등록 대상이 아니면(호실 미배정 등) 등록할 수 없어 보내지 않는다. 조회가 실패하면 홈을 막지 않는다.
  const isStudent = current.status === "ready" && profile !== null;
  useEffect(() => {
    if (!isStudent) return;
    let cancelled = false;
    fetchFaceStatus()
      .then(({ enrolled, eligible }) => {
        if (!cancelled && !enrolled && eligible) router.replace("/face");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isStudent, router]);

  const showError =
    initialStatus === "error" ||
    current.status === "error" ||
    roster.status === "error";

  return (
    <>
      <main className="flex min-h-0 flex-1 flex-col md:items-center md:p-9">
        <div className="flex min-h-0 flex-1 flex-col md:w-full md:max-w-[720px] md:gap-5">
          <MainHeader profile={profile} />
          <div className="flex min-h-0 flex-1 flex-col px-[18px] py-4 md:p-0">
            {current.status === "ready" && !profile ? (
              <StudentEmptyState
                title="학생 계정만 이용할 수 있어요"
                description="학생 계정으로 로그인해 주세요."
              />
            ) : profile && profile.roomNumber === null ? (
              <StudentEmptyState
                title="배정된 호실이 없어요"
                description="호실이 배정되면 여기에 표시됩니다."
              />
            ) : (
              <MyRoomCard
                floor={profile?.floor ?? null}
                roomNumber={profile?.roomNumber ?? null}
                students={roster.status === "ready" ? roster.mates : null}
              />
            )}
          </div>
        </div>
      </main>
      <QrFab />
      {showError && (
        <div className="pointer-events-none fixed inset-x-[18px] bottom-[176px] z-40 md:inset-x-auto md:bottom-auto md:right-8 md:top-8 md:w-[380px]">
          {roster.status === "error" && roster.rateLimited ? (
            <StatusBanner variant="neutral" message={RATE_LIMIT_MESSAGE} />
          ) : (
            <StatusBanner
              variant="error"
              message="서버와 연결이 원활하지 않습니다."
            />
          )}
        </div>
      )}
    </>
  );
}
