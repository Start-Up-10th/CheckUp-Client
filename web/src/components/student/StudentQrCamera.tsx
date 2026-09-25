"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  submitQrAttendance,
  type QrAttendanceResult,
} from "@/lib/student/mock-qr-attendance";
import { useQrScanner } from "@/lib/student/use-qr-scanner";
import { QrCameraHeader } from "./QrCameraHeader";
import { QrResultToast, type QrResultVariant } from "./QrResultToast";
import { QrScanFrame } from "./QrScanFrame";
import { StudentErrorState } from "./StudentErrorState";
import { StudentShell } from "./StudentShell";

/** 결과별 문구·색. 문구는 REQ-ATT-004/005와 Figma state messages(4:71, 345:43)를 따른다. */
const RESULT_MESSAGES: Record<
  QrAttendanceResult,
  { variant: QrResultVariant; message: string }
> = {
  approved: { variant: "success", message: "승인되었습니다" },
  expired: {
    variant: "error",
    message: "만료된 QR입니다. 다시 스캔해 주세요.",
  },
  duplicate: { variant: "neutral", message: "이미 출석 처리된 QR입니다." },
  // Figma 04·메인 state messages(205:263)에서 이 문구가 빨간 메시지라 그대로 따른다.
  closed: {
    variant: "error",
    message: "지금은 출석 인증을 받고 있지 않습니다.",
  },
  invalid: { variant: "error", message: "유효하지 않은 QR입니다." },
};

/** 승인 뒤 메인으로 가기까지(Figma에 없음 — 문구를 읽을 시간). */
const APPROVED_REDIRECT_MS = 1500;
/** 승인 외 결과 메시지를 보여 주고 다시 스캔을 시작하기까지. */
const RESULT_TOAST_MS = 2500;

/**
 * 학생 웹 QR 카메라(REQ-ATT-005). 핸드폰(Figma 4:43)은 어두운 화면에 `‹ QR 카메라`, 스캔 영역,
 * 안내 문구. 노트북(228:2)은 어두운 사이드바와 가운데 제목·스캔 영역·안내 문구.
 * QR을 읽으면 스캔을 멈추고 서버(지금은 mock)에 보낸다. 승인이면 1.5초 뒤 메인으로 가고,
 * 그 밖의 결과는 2.5초 동안 메시지를 보여 준 뒤 다시 스캔한다.
 * 카메라를 쓸 수 없으면(권한 거부·카메라 없음, Figma에 없음) 공통 오류 화면에 카메라 문구를 넣는다.
 */
export function StudentQrCamera() {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<QrAttendanceResult | null>(null);

  const handleDetect = useCallback((qrText: string) => {
    setProcessing(true);
    submitQrAttendance(qrText)
      .then(setResult)
      .catch(() => setResult("invalid"));
  }, []);

  const { videoRef, status } = useQrScanner({
    onDetect: handleDetect,
    paused: processing,
  });

  useEffect(() => {
    if (!result) return;
    const timer =
      result === "approved"
        ? setTimeout(() => router.push("/main"), APPROVED_REDIRECT_MS)
        : setTimeout(() => {
            setResult(null);
            setProcessing(false);
          }, RESULT_TOAST_MS);
    return () => clearTimeout(timer);
  }, [result, router]);

  return (
    <StudentShell showTabBar={false} sidebarTone="dark">
      <main className="flex flex-1 flex-col bg-admin-text">
        <QrCameraHeader />
        <div className="flex flex-1 flex-col items-center justify-center gap-[30px] px-[18px] pb-10 md:gap-6">
          <h1 className="hidden text-[22px] font-bold leading-normal tracking-[-0.44px] text-white md:block">
            QR 코드를 화면에 비춰 주세요
          </h1>
          {status === "error" ? (
            <div className="w-full max-w-[354px] overflow-hidden rounded-control">
              <StudentErrorState
                title="카메라를 사용할 수 없어요"
                description="브라우저 설정에서 카메라 권한을 허용해 주세요."
                onRetry={() => window.location.reload()}
              />
            </div>
          ) : (
            <QrScanFrame videoRef={videoRef} />
          )}
          <p className="text-sm leading-normal text-white/55 md:hidden">
            QR 코드를 사각형 안에 맞춰 주세요
          </p>
          <p className="hidden text-sm leading-normal text-white/50 md:block">
            노트북 카메라로 QR을 인식합니다
          </p>
        </div>
      </main>
      {result && (
        <div className="pointer-events-none fixed inset-x-[18px] bottom-10 z-50 flex justify-center md:left-60">
          <div className="w-full max-w-[354px]">
            <QrResultToast {...RESULT_MESSAGES[result]} />
          </div>
        </div>
      )}
    </StudentShell>
  );
}
