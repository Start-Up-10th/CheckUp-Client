"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { submitQrAttendance } from "@/lib/student/qr-attendance-api";
import { parseQrToken } from "@/lib/student/parse-qr-token";
import type { QrAttendanceResult } from "@/lib/student/qr-attendance-result";
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

/**
 * 페이지에 들어온 방법. 주소의 hash는 브라우저에서만 읽을 수 있어서, 확인하기 전(checking)에는
 * 카메라를 켜지 않는다. 링크(`/qr#t=<토큰>`)로 들어오면 link, 아니면 camera.
 */
type QrEntry = "checking" | "link" | "camera";

/** 승인 뒤 메인으로 가기까지(Figma에 없음 — 문구를 읽을 시간). */
const APPROVED_REDIRECT_MS = 1500;
/** 승인 외 결과 메시지를 보여 주고 다시 스캔을 시작하기까지. */
const RESULT_TOAST_MS = 2500;

/**
 * 학생 웹 QR 카메라(REQ-ATT-005). 핸드폰(Figma 4:43)은 어두운 화면에 `‹ QR 카메라`, 스캔 영역,
 * 안내 문구. 노트북(228:2)은 어두운 사이드바와 가운데 제목·스캔 영역·안내 문구.
 * QR을 읽으면 스캔을 멈추고 `/qr#t=<토큰>` 형식에서 토큰만 꺼내 서버 스캔 API에 보낸다. 승인이면 1.5초 뒤 메인으로 가고,
 * 그 밖의 결과는 2.5초 동안 메시지를 보여 준 뒤 다시 스캔한다.
 * 카메라를 쓸 수 없으면(권한 거부·카메라 없음, Figma에 없음) 공통 오류 화면에 카메라 문구를 넣는다.
 * 휴대폰 일반 카메라로 찍어 `/qr#t=<토큰>`으로 들어오면 카메라 없이 바로 제출한다(하네스 DEC-018).
 * 그 결과가 승인이 아니면 메시지를 보여 준 뒤 카메라를 켜서 다시 찍을 수 있게 한다.
 */
export function StudentQrCamera() {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<QrAttendanceResult | null>(null);
  const [entry, setEntry] = useState<QrEntry>("checking");
  // React 개발 모드(Strict Mode)에서 effect가 두 번 돌아도 진입 처리는 한 번만 한다.
  const entryHandled = useRef(false);

  // 토큰을 제출한다. 우리 QR 형식이 아니어서 토큰이 없으면(null) 서버를 부르지 않고 바로
  // "유효하지 않은 QR"로 보여 준다(하네스 DEC-018). 토큰은 로그에 남기지 않는다.
  const submitToken = useCallback((token: string | null) => {
    setProcessing(true);
    if (!token) {
      setResult("invalid");
      return;
    }
    submitQrAttendance(token)
      .then(setResult)
      .catch(() => setResult("invalid"));
  }, []);

  // 웹 내부 카메라로 읽은 QR 값에서 `#t=` 토큰만 꺼내 제출한다.
  const handleDetect = useCallback(
    (qrText: string) => submitToken(parseQrToken(qrText)),
    [submitToken],
  );

  // 휴대폰 일반 카메라로 QR을 찍으면 `/qr#t=<토큰>`으로 들어온다(하네스 DEC-018). 이때는 카메라를
  // 켜지 않고 바로 제출한다. 제출한 뒤 주소에서 `#t=…`를 지워 새로고침·뒤로가기로 같은 토큰을 다시
  // 제출하지 않게 한다. `#t=`로 시작하지만 형식이 다르면 서버를 부르지 않고 "유효하지 않은 QR"이다.
  useEffect(() => {
    if (entryHandled.current) return;
    entryHandled.current = true;
    const { hash, href, pathname, search } = window.location;
    const fromLink = hash.startsWith("#t=");
    // 브라우저 주소를 읽은 뒤에야 정할 수 있는 값이라 effect에서 한 번 정한다(파생 상태 아님).
    setEntry(fromLink ? "link" : "camera");
    if (!fromLink) return;
    // 진입할 때 한 번만 서버에 제출을 시작한다(entryHandled로 중복 방지). 제출 시작과 함께
    // "처리 중" 상태를 켜는 것이라 렌더가 연쇄로 반복되지 않는다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    submitToken(parseQrToken(href));
    window.history.replaceState(window.history.state, "", pathname + search);
  }, [submitToken]);

  const { videoRef, status } = useQrScanner({
    onDetect: handleDetect,
    paused: processing,
    enabled: entry === "camera",
  });

  useEffect(() => {
    if (!result) return;
    const timer =
      result === "approved"
        ? setTimeout(() => router.push("/main"), APPROVED_REDIRECT_MS)
        : setTimeout(() => {
            setResult(null);
            setProcessing(false);
            // 링크로 들어와 승인되지 않았으면(만료·중복·종료·형식 오류) 카메라를 켜 다시 찍게 한다
            // (Figma·계약에 없어 정한 흐름). 이미 카메라로 들어왔으면 그대로다.
            setEntry("camera");
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
