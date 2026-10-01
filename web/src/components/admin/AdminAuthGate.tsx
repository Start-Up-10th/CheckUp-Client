"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminContentState } from "@/components/admin/AdminContentState";
import { fetchCurrentMember } from "@/lib/auth/auth-api";

type GateStatus = "checking" | "allowed" | "error";

/**
 * `npm run dev:preview`로 띄운 개발 서버에서만 로그인 확인을 건너뛰어, 서버 없이 관리자 화면을 폭별로 본다.
 * 개발 모드가 아니면(프로덕션 빌드 등) 값이 있어도 무시한다. 권한의 최종 판정은 서버 API다.
 */
const PREVIEW =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_ADMIN_PREVIEW === "true";

/**
 * REQ-AUTH-001·003: 관리자 화면은 세션이 관리자(`ADMIN`)일 때만 보여 준다.
 * 미로그인은 로그인으로, 관리자가 아닌 계정은 권한 없음 화면으로 보낸다. 이동은 `replace`라 뒤로가기로
 * 막힌 화면에 돌아오지 않는다. 확인하는 동안에는 아무것도 그리지 않아 관리자 화면이 잠깐 비치지 않는다.
 * 이 확인은 화면 노출 제어일 뿐이고, 권한의 최종 판정은 서버 API가 한다.
 */
export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<GateStatus>(
    PREVIEW ? "allowed" : "checking",
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (PREVIEW) return;
    let cancelled = false;
    fetchCurrentMember().then(
      (member) => {
        if (cancelled) return;
        if (!member) router.replace("/admin/login");
        else if (member.role !== "ADMIN") router.replace("/admin/unauthorized");
        else setStatus("allowed");
      },
      () => {
        if (!cancelled) setStatus("error");
      },
    );
    return () => {
      cancelled = true;
    };
  }, [router, attempt]);

  if (status === "allowed") return <>{children}</>;

  if (status === "error") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-admin-bg">
        <AdminContentState
          variant="error"
          onRetry={() => {
            setStatus("checking");
            setAttempt((n) => n + 1);
          }}
        />
      </div>
    );
  }

  return <div className="h-screen w-full bg-admin-bg" aria-busy="true" />;
}
