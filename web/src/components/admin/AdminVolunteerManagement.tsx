"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBanner } from "@/components/admin/StatusBanner";
import { VolunteerListRow } from "@/components/admin/VolunteerListRow";
import { MOCK_VOLUNTEERS } from "@/lib/admin/mock-volunteers";

const TOAST_DURATION_MS = 2500;

/**
 * REQ-COM-001/002: 명단(소속 학생)만 보여주고, 각 행 "+"/"−"로 즉시 1회 적립/차감한다(차감은 0회 미만 불가).
 * "명단 편집" 버튼은 07 화면(봉사자 명단 편집)으로 이동한다(2026-09-23 Figma 갱신, DEC-021).
 */
export function AdminVolunteerManagement() {
  const [volunteers, setVolunteers] = useState(MOCK_VOLUNTEERS);
  const [toast, setToast] = useState<string | null>(null);
  const members = volunteers.filter((volunteer) => volunteer.isMember);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  function handleAddCredit(studentId: string) {
    setVolunteers((prev) =>
      prev.map((volunteer) =>
        volunteer.studentId === studentId
          ? { ...volunteer, count: volunteer.count + 1 }
          : volunteer,
      ),
    );
    setToast("봉사 1회를 적립했습니다.");
  }

  function handleRemoveCredit(studentId: string) {
    setVolunteers((prev) =>
      prev.map((volunteer) =>
        volunteer.studentId === studentId
          ? { ...volunteer, count: Math.max(0, volunteer.count - 1) }
          : volunteer,
      ),
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-5 px-8 py-7">
      {toast && (
        <div className="pointer-events-none fixed inset-x-4 top-6 z-50 flex justify-center md:inset-x-auto md:right-8 md:justify-end">
          <div className="pointer-events-auto w-full max-w-sm">
            <StatusBanner variant="success" message={toast} />
          </div>
        </div>
      )}

      <div className="flex w-full items-end justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-[11px] tracking-[1.98px] text-admin-textFaint">
            VOLUNTEER
          </p>
          <h1 className="text-[30px] font-bold tracking-[-0.9px] text-admin-text">
            봉사자 관리
          </h1>
        </div>
      </div>

      <div className="flex w-full items-center justify-end">
        <Link
          href="/admin/volunteers/add"
          className="flex items-center justify-center rounded-[13px] bg-admin-accent-bg px-[22px] py-[13px] text-sm font-bold text-admin-accent-text"
        >
          명단 편집
        </Link>
      </div>

      <div className="flex w-full flex-1 flex-col overflow-y-auto rounded-panel bg-admin-surface p-[22px]">
        {members.length === 0 ? (
          <p className="text-sm text-admin-textMuted">아직 데이터가 없어요</p>
        ) : (
          <div className="flex w-full flex-col gap-2">
            {members.map((volunteer) => (
              <VolunteerListRow
                key={volunteer.studentId}
                volunteer={volunteer}
                onAddCredit={handleAddCredit}
                onRemoveCredit={handleRemoveCredit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
