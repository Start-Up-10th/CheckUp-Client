"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusBanner } from "@/components/admin/StatusBanner";

const TOAST_DURATION_MS = 2500;

export type ToastMessage = {
  variant: "success" | "error" | "neutral";
  message: string;
};

/** 화면 상단에 잠깐 떴다 사라지는 상태 메시지(REQ-UI-006). 같은 문구를 다시 띄워도 타이머가 새로 시작된다. */
export function useToast() {
  const [toast, setToast] = useState<({ id: number } & ToastMessage) | null>(
    null,
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = useCallback(
    (next: ToastMessage) => setToast({ id: Date.now(), ...next }),
    [],
  );

  return { toast, showToast };
}

export function ToastLayer({ toast }: { toast: ToastMessage | null }) {
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-4 top-6 z-50 flex justify-center md:inset-x-auto md:right-8 md:justify-end">
      <div className="pointer-events-auto w-full max-w-sm">
        <StatusBanner variant={toast.variant} message={toast.message} />
      </div>
    </div>
  );
}
