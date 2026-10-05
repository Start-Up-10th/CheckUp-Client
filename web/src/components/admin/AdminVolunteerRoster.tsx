"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminContentState } from "@/components/admin/AdminContentState";
import { FloorTabs } from "@/components/admin/FloorTabs";
import { ToastLayer, useToast } from "@/components/admin/Toast";
import { VolunteerDesignatedBar } from "@/components/admin/VolunteerDesignatedBar";
import { VolunteerRosterRow } from "@/components/admin/VolunteerRosterRow";
import { VolunteerStudentDialog } from "@/components/admin/VolunteerStudentDialog";
import type { Floor } from "@/lib/admin/mock-floor-data";
import { failureToast, useSingleFlight } from "@/lib/admin/volunteer-action";
import { useVolunteerGateway } from "@/lib/admin/volunteer-gateway";
import { groupByRoom } from "@/lib/admin/volunteer-roster";
import { useVolunteerRoster } from "@/lib/admin/volunteer-roster-store";

const DEFAULT_FLOOR: Floor = 4;

/** 명단을 서버에서 받지 못했을 때(Figma 07 state messages). */
const LIST_FAILURE_MESSAGE =
  "학생 명단을 불러오지 못했습니다. 다시 시도해 주세요.";

/** 서버가 이유를 알려 주지 않은 지정 실패(Figma 07 state messages). */
const DESIGNATE_FAILURE_MESSAGE =
  "당일 봉사자 지정에 실패했습니다. 다시 시도해 주세요.";

/**
 * 토스트는 헤더 조작부(층 탭·검색창) 바로 아래 8px에 둬 탭·검색창·행 버튼을 가리지 않는다: 폰 121px(검색창
 * 하단 113px), 패드 139px(검색창 하단 131px). 컴퓨터는 검색창이 왼쪽 420px라 층 탭(하단 83px) 아래 오른쪽 91px이다.
 */
const TOAST_POSITION =
  "inset-x-4 top-[121px] justify-end md:left-[96px] md:right-[22px] md:top-[139px] md:justify-end xl:left-[300px] xl:right-8 xl:top-[91px]";

/**
 * REQ-COM-001: 봉사자 명단 편집(Figma 07). 전체 학생을 층 탭·검색으로 거르고 호실별로 묶어 보여 준다.
 * 학생 행을 누르면 남은 횟수와 봉사 이력을 보는 상세 다이얼로그가 열리고, 횟수 조정은 학생 관리에서 한다.
 * 아래 `당일 지정 N명 · 봉사자 관리 →` 바는 이 화면에서 `봉사자 지정`을 한 뒤에만 뜬다(처음 들어오면 없고, 봉사자 관리에
 * 다녀와서 다시 들어오면 지정하기 전까지 숨는다). 명단에 학생을 추가·제외하는 단계는 없다.
 */
export function AdminVolunteerRoster() {
  const { roster, status, updateStudent, reload } = useVolunteerRoster();
  const [floor, setFloor] = useState<Floor>(DEFAULT_FLOOR);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 이 방문에서 `봉사자 지정`을 한 번이라도 성공했는지. 화면을 떠났다 돌아오면 다시 false다.
  const [designatedHere, setDesignatedHere] = useState(false);
  const gateway = useVolunteerGateway();
  const singleFlight = useSingleFlight();
  const { toast, showToast } = useToast();
  const selected =
    roster.find((student) => student.studentId === selectedId) ?? null;
  // 봉사자 관리(06)가 보여 주는 사람과 같게, 완료한 학생은 빼고 아직 완료하지 않은 지정만 센다.
  const designatedCount = roster.filter(
    (student) => student.duty === "designated",
  ).length;

  const barVisible = designatedHere && designatedCount > 0;

  const groups = useMemo(
    () => groupByRoom(roster, { floor, query }),
    [roster, floor, query],
  );

  useEffect(() => {
    if (status === "error") {
      showToast({ variant: "error", message: LIST_FAILURE_MESSAGE });
    }
  }, [status, showToast]);

  function handleDesignate(studentId: string) {
    const target = roster.find((student) => student.studentId === studentId);
    if (!target) return;
    return singleFlight(target.id, async () => {
      try {
        const updated = await gateway.designate(target.id);
        updateStudent(updated);
        setDesignatedHere(true);
        showToast({
          variant: "success",
          message: "당일 봉사자로 지정했습니다.",
        });
      } catch (error) {
        const failure = failureToast(error, DESIGNATE_FAILURE_MESSAGE, reload);
        if (failure) showToast(failure);
      }
    });
  }

  return (
    <div className="relative flex h-full w-full flex-col gap-3.5 px-4 py-3.5 md:gap-4 md:px-[22px] md:py-6 xl:gap-5 xl:px-8 xl:py-7">
      <ToastLayer toast={toast} positionClassName={TOAST_POSITION} />

      <div className="flex w-full items-end justify-between">
        <div className="flex flex-col gap-0.5 md:gap-[3px] xl:gap-1">
          <p className="font-mono text-[10px] leading-[13px] tracking-[1.6px] text-admin-textFaint md:tracking-[1.8px] xl:text-[11px] xl:leading-[15px] xl:tracking-[1.98px]">
            <span className="md:hidden">ADMIN</span>
            <span className="hidden md:inline">VOLUNTEER</span>
          </p>
          <h1 className="text-[22px] font-bold leading-[26px] tracking-[-0.44px] text-admin-text md:text-[26px] md:leading-[31px] md:tracking-[-0.78px] xl:text-[30px] xl:leading-[36px] xl:tracking-[-0.9px]">
            봉사자 명단 편집
          </h1>
        </div>
        <FloorTabs selected={floor} onSelect={setFloor} desktopTrack />
      </div>

      <div className="w-full xl:flex xl:h-[49px] xl:items-center">
        <label className="flex h-11 w-full items-center gap-2 rounded-control border border-admin-border bg-admin-rowSurface px-3.5 md:px-4 transition-colors focus-within:border-admin-textMuted focus-within:bg-admin-surface motion-reduce:transition-none xl:h-[46px] xl:w-[420px] xl:gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- Figma 검색 아이콘 원본 SVG */}
          <img
            src="/icons/admin/search.svg"
            alt=""
            aria-hidden="true"
            width={16}
            height={16}
            className="size-4 shrink-0"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="봉사자 검색"
            placeholder="이름, 학번 또는 호실로 검색"
            className="min-w-0 flex-1 bg-transparent text-sm leading-[17px] text-admin-text placeholder:text-admin-textMuted focus:outline-none"
          />
        </label>
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col gap-2.5 overflow-y-auto md:gap-3.5 xl:gap-0 rounded-[16px] bg-admin-surface p-3.5 pt-4 md:rounded-[18px] md:p-5 xl:rounded-panel xl:p-[22px]">
        <p className="text-[11px] leading-[13px] text-admin-textSecondary md:text-xs md:leading-[14px] xl:hidden">
          전교생 {roster.length}명 · 당일 지정 {designatedCount}명
        </p>
        {status === "error" ? (
          <AdminContentState variant="error" onRetry={reload} />
        ) : status !== "ready" ? (
          <p className="py-6 text-center text-sm text-admin-textMuted">
            불러오는 중…
          </p>
        ) : groups.length === 0 ? (
          <p className="py-6 text-center text-sm text-admin-textMuted">
            검색 결과가 없습니다.
          </p>
        ) : (
          <div
            className={`flex flex-col gap-4 md:gap-[18px] xl:gap-[22px] ${barVisible ? "xl:pb-20" : ""}`}
          >
            {groups.map((group) => (
              <section
                key={group.roomNumber}
                aria-label={`${group.roomNumber}호`}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-1.5 pl-0.5 xl:gap-2 xl:pl-1">
                  <h2 className="text-[13px] font-bold leading-4 text-admin-text md:text-sm md:leading-[17px] xl:text-[15px] xl:leading-[18px]">
                    {group.roomNumber}호
                  </h2>
                  <p className="font-mono text-[10px] leading-[13px] text-admin-textMuted md:text-[11px] md:leading-[15px] xl:text-xs xl:leading-4">
                    {group.students.length}명
                  </p>
                </div>
                {group.students.map((student) => (
                  <VolunteerRosterRow
                    key={student.studentId}
                    student={student}
                    onSelect={setSelectedId}
                    onDesignate={handleDesignate}
                  />
                ))}
              </section>
            ))}
          </div>
        )}
      </div>

      <VolunteerDesignatedBar count={barVisible ? designatedCount : 0} />
      {selected ? (
        <VolunteerStudentDialog
          key={selected.studentId}
          student={selected}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </div>
  );
}
