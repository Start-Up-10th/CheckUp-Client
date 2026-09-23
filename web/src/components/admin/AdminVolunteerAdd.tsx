"use client";

import { useEffect, useState } from "react";
import { RemoveVolunteerDialog } from "@/components/admin/RemoveVolunteerDialog";
import { StatusBanner } from "@/components/admin/StatusBanner";
import { VolunteerSearchRow } from "@/components/admin/VolunteerSearchRow";
import { MOCK_VOLUNTEERS, type Volunteer } from "@/lib/admin/mock-volunteers";

const TOAST_DURATION_MS = 2500;

/**
 * REQ-COM-001: 전체 학생을 검색해 명단에 추가/제외한다. 제외는 확인 다이얼로그를 거친다.
 * 화면 이름은 "봉사자 명단 편집"이다(2026-09-23 Figma 갱신, 이전 "봉사자 추가"에서 변경, DEC-023).
 */
export function AdminVolunteerAdd() {
  const [volunteers, setVolunteers] = useState(MOCK_VOLUNTEERS);
  const [query, setQuery] = useState("");
  const [removeTarget, setRemoveTarget] = useState<Volunteer | null>(null);
  const [toast, setToast] = useState<{
    variant: "success" | "neutral";
    message: string;
  } | null>(null);

  const filtered = volunteers.filter(
    (volunteer) =>
      volunteer.name.includes(query) || volunteer.studentId.includes(query),
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  function handleAdd(studentId: string) {
    setVolunteers((prev) =>
      prev.map((volunteer) =>
        volunteer.studentId === studentId
          ? { ...volunteer, isMember: true }
          : volunteer,
      ),
    );
    setToast({ variant: "success", message: "봉사자 명단에 추가했습니다." });
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
    setToast({ variant: "neutral", message: "명단에서 제외했습니다." });
  }

  return (
    <div className="flex h-full w-full flex-col gap-3.5 px-4 py-3.5 md:gap-5 md:px-8 md:py-7">
      {toast && (
        <div className="pointer-events-none fixed inset-x-4 top-6 z-50 flex justify-center md:inset-x-auto md:right-8 md:justify-end">
          <div className="pointer-events-auto w-full max-w-sm">
            <StatusBanner variant={toast.variant} message={toast.message} />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <p className="font-mono text-[11px] tracking-[1.98px] text-admin-textFaint">
          VOLUNTEER
        </p>
        <h1 className="text-[30px] font-bold tracking-[-0.9px] text-admin-text">
          봉사자 명단 편집
        </h1>
      </div>

      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="이름 또는 학번으로 검색"
        className="h-[46px] w-full max-w-[173px] rounded-control border border-admin-border bg-admin-rowSurface px-4 text-sm text-admin-text placeholder:text-admin-textMuted focus:outline-none"
      />

      <div className="flex w-full flex-1 flex-col overflow-y-auto rounded-panel bg-admin-surface p-[22px]">
        {filtered.length === 0 ? (
          <p className="text-sm text-admin-textMuted">검색 결과가 없습니다.</p>
        ) : (
          <div className="flex w-full flex-col gap-2">
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
