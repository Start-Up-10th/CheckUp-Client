"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBanner } from "@/components/admin/StatusBanner";
import { ToastLayer, useToast } from "@/components/admin/Toast";
import { VolunteerListRow } from "@/components/admin/VolunteerListRow";
import { MOCK_VOLUNTEERS } from "@/lib/admin/mock-volunteers";

/**
 * REQ-COM-001/002: 명단(소속 학생)만 보여주고, 각 행 "+"/"−"로 즉시 1회 적립/차감한다(차감은 0회 미만 불가).
 * "명단 편집" 버튼은 07 화면(봉사자 명단 편집)으로 이동한다(2026-09-23 Figma 갱신, DEC-023).
 */
export function AdminVolunteerManagement({
  listLoadFailed = false,
}: {
  /** 학생 목록 조회 실패. 실제 조회 연결 전까지 기본은 false다. */
  listLoadFailed?: boolean;
}) {
  const [volunteers, setVolunteers] = useState(MOCK_VOLUNTEERS);
  const { toast, showToast } = useToast();
  const members = volunteers.filter((volunteer) => volunteer.isMember);

  function handleAddCredit(studentId: string) {
    setVolunteers((prev) =>
      prev.map((volunteer) =>
        volunteer.studentId === studentId
          ? { ...volunteer, count: volunteer.count + 1 }
          : volunteer,
      ),
    );
    showToast({ variant: "success", message: "봉사 1회를 적립했습니다." });
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
    <div className="flex h-full w-full flex-col gap-3.5 px-4 py-3.5 md:gap-5 md:px-8 md:py-7">
      <ToastLayer toast={toast} />

      <div className="flex w-full items-center justify-between md:items-end">
        <div className="flex flex-col gap-0.5 md:gap-1">
          <p className="font-mono text-[10px] leading-[13px] tracking-[1.6px] text-admin-textFaint md:text-[11px] md:leading-normal md:tracking-[1.98px]">
            <span className="md:hidden">ADMIN</span>
            <span className="hidden md:inline">VOLUNTEER</span>
          </p>
          <h1 className="text-[22px] font-bold leading-[26px] tracking-[-0.44px] text-admin-text md:text-[30px] md:leading-normal md:tracking-[-0.9px]">
            봉사자 관리
          </h1>
        </div>
        <Link
          href="/admin/volunteers/add"
          className="flex items-center justify-center rounded-[13px] bg-admin-accent-bg px-4 py-2.5 text-[13px] font-bold leading-4 text-admin-accent-text md:hidden"
        >
          명단 편집
        </Link>
      </div>

      <div className="hidden w-full items-center justify-end md:flex">
        <Link
          href="/admin/volunteers/add"
          className="flex items-center justify-center rounded-[13px] bg-admin-accent-bg px-[22px] py-[13px] text-sm font-bold text-admin-accent-text"
        >
          명단 편집
        </Link>
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col gap-2.5 overflow-hidden rounded-[16px] bg-admin-surface px-3.5 py-4 md:gap-0 md:overflow-y-auto md:rounded-panel md:p-[22px]">
        <p className="text-[11px] leading-[13px] text-admin-textSecondary md:hidden">
          학생 목록
        </p>
        {listLoadFailed ? (
          <StatusBanner
            variant="error"
            message="학생 목록을 불러오지 못했습니다. 다시 시도해 주세요."
          />
        ) : members.length === 0 ? (
          <p className="text-sm text-admin-textMuted">아직 데이터가 없어요</p>
        ) : (
          <div className="flex min-h-0 w-full flex-1 flex-col gap-2 overflow-y-auto md:flex-none md:overflow-visible">
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
