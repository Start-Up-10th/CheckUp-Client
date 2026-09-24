"use client";

import { useState } from "react";
import { RemoveVolunteerDialog } from "@/components/admin/RemoveVolunteerDialog";
import { ToastLayer, useToast } from "@/components/admin/Toast";
import { VolunteerSearchRow } from "@/components/admin/VolunteerSearchRow";
import { MOCK_VOLUNTEERS, type Volunteer } from "@/lib/admin/mock-volunteers";

/**
 * REQ-COM-001: 전체 학생을 검색해 명단에 추가/제외한다. 제외는 확인 다이얼로그를 거친다.
 * 화면 이름은 "봉사자 명단 편집"이다(2026-09-23 Figma 갱신, 이전 "봉사자 추가"에서 변경, DEC-023).
 */
export function AdminVolunteerAdd() {
  const [volunteers, setVolunteers] = useState(MOCK_VOLUNTEERS);
  const [query, setQuery] = useState("");
  const [removeTarget, setRemoveTarget] = useState<Volunteer | null>(null);
  const { toast, showToast } = useToast();

  const filtered = volunteers.filter(
    (volunteer) =>
      volunteer.name.includes(query) || volunteer.studentId.includes(query),
  );

  function handleAdd(studentId: string) {
    if (volunteers.some((v) => v.studentId === studentId && v.isMember)) {
      showToast({
        variant: "neutral",
        message: "이미 명단에 등록된 학생입니다.",
      });
      return;
    }
    setVolunteers((prev) =>
      prev.map((volunteer) =>
        volunteer.studentId === studentId
          ? { ...volunteer, isMember: true }
          : volunteer,
      ),
    );
    showToast({ variant: "success", message: "봉사자 명단에 추가했습니다." });
  }

  function handleConfirmRemove() {
    if (!removeTarget) return;
    setVolunteers((prev) =>
      prev.map((volunteer) =>
        volunteer.studentId === removeTarget.studentId
          ? { ...volunteer, isMember: false }
          : volunteer,
      ),
    );
    setRemoveTarget(null);
    showToast({ variant: "neutral", message: "명단에서 제외했습니다." });
  }

  return (
    <div className="flex h-full w-full flex-col gap-3.5 px-4 py-3.5 md:gap-5 md:px-8 md:py-7">
      <ToastLayer toast={toast} />

      <div className="flex flex-col gap-0.5 md:gap-1">
        <p className="font-mono text-[10px] leading-[13px] tracking-[1.6px] text-admin-textFaint md:text-[11px] md:leading-normal md:tracking-[1.98px]">
          <span className="md:hidden">ADMIN</span>
          <span className="hidden md:inline">VOLUNTEER</span>
        </p>
        <h1 className="text-[22px] font-bold leading-[26px] tracking-[-0.44px] text-admin-text md:text-[30px] md:leading-normal md:tracking-[-0.9px]">
          봉사자 명단 편집
        </h1>
      </div>

      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="이름 또는 학번으로 검색"
        className="h-11 w-full max-w-[168px] rounded-control border border-admin-border bg-admin-rowSurface px-3.5 text-sm md:h-[46px] md:max-w-[173px] md:px-4 text-admin-text placeholder:text-admin-textMuted focus:outline-none"
      />

      <div className="flex min-h-0 w-full flex-1 flex-col gap-2.5 overflow-hidden rounded-[16px] bg-admin-surface px-3.5 py-4 md:gap-0 md:overflow-y-auto md:rounded-panel md:p-[22px]">
        <p className="text-[11px] leading-[13px] text-admin-textSecondary md:hidden">
          전체 학생
        </p>
        {filtered.length === 0 ? (
          <p className="text-sm text-admin-textMuted">검색 결과가 없습니다.</p>
        ) : (
          <div className="flex min-h-0 w-full flex-1 flex-col gap-2 overflow-y-auto md:flex-none md:overflow-visible">
            {filtered.map((volunteer) => (
              <VolunteerSearchRow
                key={volunteer.studentId}
                volunteer={volunteer}
                onAdd={handleAdd}
                onRequestRemove={setRemoveTarget}
              />
            ))}
          </div>
        )}
      </div>

      {removeTarget ? (
        <RemoveVolunteerDialog
          volunteer={removeTarget}
          onCancel={() => setRemoveTarget(null)}
          onConfirm={handleConfirmRemove}
        />
      ) : null}
    </div>
  );
}
