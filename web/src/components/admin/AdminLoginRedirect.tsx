"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentMember } from "@/lib/auth/auth-api";

/**
 * 이미 관리자로 로그인한 사람이 `/admin/login`에 오면 관리자 홈으로 보낸다(REQ-AUTH-003).
 * 로그인 화면은 확인을 기다리지 않고 바로 보여 준다. 로그인하지 않았거나 관리자가 아니거나 확인에
 * 실패하면 아무것도 하지 않아 그대로 로그인할 수 있다. 화면에는 아무것도 그리지 않는다.
 */
export function AdminLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    fetchCurrentMember()
      .then((member) => {
        if (!cancelled && member?.role === "ADMIN") router.replace("/admin");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
