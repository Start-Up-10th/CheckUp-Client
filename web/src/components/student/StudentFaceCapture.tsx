"use client";

import { Roboto_Mono } from "next/font/google";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFaceCamera } from "@/lib/student/use-face-camera";
import { useIsLaptop } from "@/lib/student/use-is-laptop";
import { FaceCaptureActions } from "./FaceCaptureActions";
import { FaceCaptureStatus } from "./FaceCaptureStatus";
import { FaceGuideFrame } from "./FaceGuideFrame";
import { FaceLaptopNotice } from "./FaceLaptopNotice";
import { StudentErrorState } from "./StudentErrorState";

// 카운트다운 숫자는 Figma대로 Roboto Mono SemiBold(600). 루트는 400만 불러와 여기서 600을 더 불러온다.
const countdownFont = Roboto_Mono({ subsets: ["latin"], weight: ["600"] });

type Phase = "countdown" | "capturing" | "done";

const COUNTDOWN_FROM = 3;
/** "촬영 중" 단계 길이(Figma에 없음 — 약 100프레임 ≈ 초당 30장 × 3초). */
const CAPTURE_MS = 3000;

/**
 * 학생 휴대폰 최초 얼굴 등록(REQ-FACE-001). 셔터 없이 카메라가 준비되면 3→2→1 후 자동 촬영,
 * 카운트다운(Figma 4:2) → 촬영 중(692:5) → 완료(692:24) 세 단계. 완료에서 `다시 찍기`는
 * 카운트다운부터, `완료`는 학생 홈으로 간다. 노트북(md 이상, 239:2)은 카메라를 켜지 않고 안내만 보인다.
 *
 * 개인정보(REQ-FACE-002): 프레임 추출·등록 계약(POST /api/v1/face/registration)이 아직 없어
 * 지금은 영상을 화면에 보여 주기만 하고 한 장도 캡처·저장·전송하지 않는다. 계약이 생기면
 * "촬영 중" 단계에서 프레임을 메모리로만 모아 보내고, 성공·실패·다시 찍기·이탈 때 즉시 버린다.
 * 실패 문구(얼굴 인식 실패·조명 어두움·등록 실패)는 그 서버 결과가 생길 때 연결한다.
 *
 * 영상은 셀카처럼 좌우 반전하고, 코너 가이드와 "얼굴을 화면 안에 맞춰 주세요"는 Figma에 없어
 * 명세대로 추가했다(사용자 결정). 위 56px 흰 띠는 Figma 상태바 자리(보이는 위치 그대로 기준).
 */
export function StudentFaceCapture() {
  const router = useRouter();
  const isLaptop = useIsLaptop();
  const { videoRef, status } = useFaceCamera({ enabled: isLaptop === false });
  const [phase, setPhase] = useState<Phase>("countdown");
  const [count, setCount] = useState(COUNTDOWN_FROM);

  useEffect(() => {
    if (status !== "ready") return;
    if (phase === "countdown") {
      const timer = setTimeout(() => {
        if (count > 1) setCount(count - 1);
        else setPhase("capturing");
      }, 1000);
      return () => clearTimeout(timer);
    }
    if (phase === "capturing") {
      const timer = setTimeout(() => setPhase("done"), CAPTURE_MS);
      return () => clearTimeout(timer);
    }
  }, [status, phase, count]);

  const retake = () => {
    setCount(COUNTDOWN_FROM);
    setPhase("countdown");
  };

  const done = phase === "done";
  const statusMessage =
    phase === "countdown"
      ? `${count}초 후 자동으로 촬영합니다`
      : phase === "capturing"
        ? "촬영 중이에요"
        : "촬영이 완료되었어요";

  return (
    <main className="flex min-h-dvh flex-col bg-admin-surface md:items-center md:justify-center md:bg-admin-bg md:py-10">
      <div className="hidden md:block">
        <FaceLaptopNotice />
      </div>

      <div className="flex flex-1 flex-col pt-14 md:hidden">
        <h1 className="sr-only">얼굴 등록</h1>
        {status === "error" ? (
          <div className="flex flex-1 items-center justify-center px-[18px]">
            <StudentErrorState
              title="카메라를 사용할 수 없어요"
              description="브라우저 설정에서 카메라 권한을 허용해 주세요."
              onRetry={() => window.location.reload()}
            />
          </div>
        ) : (
          <>
            <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#f0f0f1]">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                aria-label="얼굴 촬영 카메라 화면"
                className="absolute inset-0 size-full -scale-x-100 object-cover"
              />
              <p className="relative mb-5 rounded-full bg-admin-ghost-bg px-4 py-2.5 text-[13px] leading-normal text-admin-ghost-text">
                얼굴을 화면 안에 맞춰 주세요
              </p>
              <FaceGuideFrame>
                {phase === "countdown" && status === "ready" && (
                  <span
                    aria-hidden="true"
                    className={`${countdownFont.className} text-8xl font-semibold leading-normal text-admin-text`}
                  >
                    {count}
                  </span>
                )}
              </FaceGuideFrame>
              <div
                className={`absolute inset-x-0 flex justify-center ${
                  done ? "bottom-[34px]" : "bottom-[116px]"
                }`}
              >
                <FaceCaptureStatus message={statusMessage} done={done} />
              </div>
            </div>
            {done && (
              <div className="pb-8 pt-[22px]">
                <FaceCaptureActions
                  onRetake={retake}
                  onComplete={() => router.push("/main")}
                />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
