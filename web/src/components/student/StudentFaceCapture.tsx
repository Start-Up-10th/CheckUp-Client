"use client";

import { Roboto_Mono } from "next/font/google";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { StatusBanner } from "@/components/admin/StatusBanner";
import {
  FaceLoginRequiredError,
  FaceNotStudentError,
  enrollFace,
  fetchFaceStatus,
} from "@/lib/student/face-enroll-api";
import {
  pickFaceVideoType,
  startFaceRecording,
} from "@/lib/student/face-recorder";
import { useFaceCamera } from "@/lib/student/use-face-camera";
import { useIsLaptop } from "@/lib/student/use-is-laptop";
import { FaceCaptureActions } from "./FaceCaptureActions";
import { FaceCaptureStatus } from "./FaceCaptureStatus";
import { FaceLaptopNotice } from "./FaceLaptopNotice";
import { StudentErrorState } from "./StudentErrorState";

// 카운트다운 숫자는 Figma대로 Roboto Mono SemiBold(600). 루트는 400만 불러와 여기서 600을 더 불러온다.
const countdownFont = Roboto_Mono({ subsets: ["latin"], weight: ["600"] });

type Phase = "countdown" | "capturing" | "done";

/** 화면에 들어올 때 서버에서 확인한 결과. checking 동안에는 카메라를 켜지 않는다. */
type Entry = "checking" | "allowed" | "notStudent" | "notEligible";

/** 등록 실패 종류. rejected·lowLight·multipleFaces는 서버가 영상을 거절한 경우(422)다. */
type Failure =
  "rejected" | "lowLight" | "multipleFaces" | "failed" | "notStudent";

// rejected·lowLight·failed 문구는 REQ-FACE-001. 여러 명 문구는 명세·Figma에 없어 같은 말투로 정했다.
const FAILURE_MESSAGES: Record<Failure, string> = {
  rejected: "얼굴 인식에 실패했습니다. 다시 촬영해 주세요.",
  lowLight: "조명이 어두워요. 밝은 곳에서 촬영해 주세요.",
  multipleFaces: "여러 명의 얼굴이 보여요. 본인만 나오게 다시 촬영해 주세요.",
  failed: "얼굴 등록에 실패했습니다. 다시 시도해 주세요.",
  notStudent: "학생 계정만 이용할 수 있어요.",
};

const COUNTDOWN_FROM = 3;
/** "촬영 중" 단계 길이(Figma에 없음 — 약 100프레임 ≈ 초당 30장 × 3초). */
const CAPTURE_MS = 3000;

/**
 * 학생 휴대폰 최초 얼굴 등록(REQ-FACE-001). 셔터 없이 카메라가 준비되면 3→2→1 후 자동 촬영,
 * 카운트다운(Figma 4:2) → 촬영 중(692:5) → 완료(692:24) 세 단계. 완료에서 `다시 찍기`는
 * 카운트다운부터, `완료`는 서버에 등록한 뒤 학생 홈으로 간다. 노트북(md 이상, 239:2)은 카메라를 켜지 않고 안내만 보인다.
 *
 * 들어오면 서버에서 본인 상태를 확인한다(`GET /api/v1/face/me`). 이미 등록했으면 학생 홈으로(다시 바꾸는
 * 기능은 없다), 필수 동의가 없으면 동의 화면으로, 로그인이 안 돼 있으면 로그인 화면으로 보낸다. 등록 대상이
 * 아니면(서버 기준: 기숙사 호실이 배정된 학생만) 카메라를 켜지 않고 안내만 보인다. 확인이 실패하면(서버 오류)
 * 촬영은 막지 않는다 — 등록 요청에서 같은 판정을 다시 받는다.
 *
 * 개인정보(REQ-FACE-002): `촬영 중` 단계에만 카메라 영상을 메모리에 녹화하고, `완료`를 누르면 그 영상
 * 하나를 서버로 보낸다(`POST /api/v1/face/enrollments`). 영상은 저장·기록하지 않고, 등록 성공·실패·
 * 다시 찍기·화면 이탈 때 바로 버린다. 그래서 등록이 실패하면 보낼 영상이 없어 `완료`는 막히고 `다시 찍기`로
 * 새로 촬영한다. 프레임 추출·품질 평가는 서버(AI)가 한다.
 *
 * 화면은 Figma 그대로다(카운트다운 숫자와 아래 단계 안내만, 코너 가이드·"얼굴을 화면 안에 맞춰 주세요"
 * 없음 — 사용자 결정 2026-09-25). 영상은 셀카처럼 좌우 반전한다(보내는 영상은 반전하지 않은 원본). 위 56px
 * 흰 띠는 Figma 상태바 자리(보이는 위치 그대로 기준). 실패 문구 위치·등록 중 안내·녹화를 지원하지 않는
 * 브라우저 안내는 Figma에 없어 기존 오류 배너·오류 화면을 썼다.
 */
export function StudentFaceCapture() {
  const router = useRouter();
  const isLaptop = useIsLaptop();
  const [entry, setEntry] = useState<Entry>("checking");
  const { videoRef, status, stream } = useFaceCamera({
    enabled: isLaptop === false && entry === "allowed",
  });
  const [phase, setPhase] = useState<Phase>("countdown");
  const [count, setCount] = useState(COUNTDOWN_FROM);
  // 촬영본은 화면 상태(state)가 아니라 ref에만 둔다 — 화면에 그리지 않고, 버릴 때 참조만 끊으면 된다.
  const videoBlobRef = useRef<Blob | null>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchFaceStatus()
      .then(({ consented, eligible, enrolled }) => {
        if (cancelled) return;
        if (enrolled) router.replace("/main");
        else if (!consented) router.replace("/consent");
        else setEntry(eligible ? "allowed" : "notEligible");
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        if (reason instanceof FaceLoginRequiredError) router.replace("/login");
        else if (reason instanceof FaceNotStudentError) setEntry("notStudent");
        else setEntry("allowed");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (status !== "ready" || phase !== "countdown") return;
    const timer = setTimeout(() => {
      if (count > 1) setCount(count - 1);
      else setPhase("capturing");
    }, 1000);
    return () => clearTimeout(timer);
  }, [status, phase, count]);

  useEffect(() => {
    if (status !== "ready" || phase !== "capturing" || !stream) return;
    const recording = startFaceRecording(stream);
    if (!recording) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      recording
        .finish()
        .then((video) => {
          if (cancelled) return;
          videoBlobRef.current = video;
          setHasVideo(true);
        })
        .catch(() => {
          if (!cancelled) setFailure("failed");
        })
        .finally(() => {
          if (!cancelled) setPhase("done");
        });
    }, CAPTURE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      recording.discard();
    };
  }, [status, phase, stream]);

  // 화면을 벗어나면 보내지 않은 촬영본을 버린다.
  useEffect(
    () => () => {
      videoBlobRef.current = null;
    },
    [],
  );

  const discardVideo = () => {
    videoBlobRef.current = null;
    setHasVideo(false);
  };

  const retake = () => {
    discardVideo();
    setFailure(null);
    setCount(COUNTDOWN_FROM);
    setPhase("countdown");
  };

  const complete = () => {
    const video = videoBlobRef.current;
    if (!video || submitting) return;
    setSubmitting(true);
    setFailure(null);
    enrollFace(video)
      .then((result) => {
        if (result === "registered" || result === "alreadyRegistered") {
          router.push("/main");
        } else if (result === "consentRequired") {
          router.replace("/consent");
        } else if (result === "notEligible") {
          setEntry("notEligible");
        } else {
          setFailure(result);
        }
      })
      .catch((reason: unknown) => {
        if (reason instanceof FaceLoginRequiredError) {
          router.replace("/login");
          return;
        }
        setFailure(
          reason instanceof FaceNotStudentError ? "notStudent" : "failed",
        );
      })
      .finally(() => {
        discardVideo();
        setSubmitting(false);
      });
  };

  const done = phase === "done";
  // 서버가 받는 형식으로 녹화할 수 없는 브라우저. 카메라가 켜진 뒤(브라우저에서만) 확인한다.
  const cannotRecord = status === "ready" && pickFaceVideoType() === null;
  const statusMessage = submitting
    ? "얼굴을 등록하고 있어요"
    : phase === "countdown"
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
        {entry === "notStudent" ? (
          <div className="flex flex-1 items-center justify-center px-[18px]">
            <StudentErrorState
              title="학생 계정만 이용할 수 있어요"
              description="학생 계정으로 로그인해 주세요."
              onRetry={() => window.location.reload()}
            />
          </div>
        ) : entry === "notEligible" ? (
          <div className="flex flex-1 items-center justify-center px-[18px]">
            <StudentErrorState
              title="얼굴 등록 대상이 아니에요"
              description="기숙사 호실이 배정된 학생만 등록할 수 있어요."
              onRetry={() => window.location.reload()}
            />
          </div>
        ) : status === "error" ? (
          <div className="flex flex-1 items-center justify-center px-[18px]">
            <StudentErrorState
              title="카메라를 사용할 수 없어요"
              description="브라우저 설정에서 카메라 권한을 허용해 주세요."
              onRetry={() => window.location.reload()}
            />
          </div>
        ) : cannotRecord ? (
          <div className="flex flex-1 items-center justify-center px-[18px]">
            <StudentErrorState
              title="이 브라우저에서는 얼굴을 등록할 수 없어요"
              description="크롬이나 사파리 최신 버전에서 다시 시도해 주세요."
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
              {phase === "countdown" && status === "ready" && (
                <span
                  aria-hidden="true"
                  className={`${countdownFont.className} relative text-8xl font-semibold leading-normal text-admin-text`}
                >
                  {count}
                </span>
              )}
              {failure && (
                <div className="absolute inset-x-[18px] top-4">
                  <StatusBanner
                    variant="error"
                    message={FAILURE_MESSAGES[failure]}
                  />
                </div>
              )}
              <div
                className={`absolute inset-x-0 flex justify-center ${
                  done ? "bottom-[34px]" : "bottom-[116px]"
                }`}
              >
                <FaceCaptureStatus
                  message={statusMessage}
                  done={done && hasVideo && !submitting}
                />
              </div>
            </div>
            {done && (
              <div className="pb-8 pt-[22px]">
                <FaceCaptureActions
                  onRetake={retake}
                  onComplete={complete}
                  retakeDisabled={submitting}
                  completeDisabled={submitting || !hasVideo}
                />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
