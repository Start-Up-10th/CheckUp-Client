"use client";

import { useLogout } from "@/lib/student/use-logout";
import { StudentConfirmDialog } from "./StudentConfirmDialog";

/**
 * 학생 로그아웃 확인 창(#356, DEC-105). 잘못 누르면 DataGSM 로그인을 다시 해야 해서 한 번 묻는다.
 * `로그아웃`만 서버 세션을 끊고(useLogout) 로그인 화면으로 가며, `취소`는 창만 닫는다.
 */
export function LogoutConfirmDialog({ onCancel }: { onCancel: () => void }) {
  const logout = useLogout();

  return (
    <StudentConfirmDialog
      title="로그아웃할까요?"
      description="다시 들어오려면 DataGSM으로 로그인해야 해요."
      confirmLabel="로그아웃"
      tone="danger"
      onCancel={onCancel}
      onConfirm={logout}
    />
  );
}
