"use client";

import jsQR from "jsqr";
import { useEffect, useRef, useState } from "react";

export type QrScannerStatus = "requesting" | "scanning" | "error";

/** 영상에서 QR을 찾는 간격. 너무 짧으면 폰 배터리·발열이 늘고, 길면 인식이 느리게 느껴진다. */
const SCAN_INTERVAL_MS = 200;
/** 판독용으로 줄여 읽는 최대 폭. QR 판독에는 충분하고 계산량을 줄인다. */
const MAX_SCAN_WIDTH = 640;

/**
 * REQ-ATT-005 학생 웹 QR 카메라. 페이지에 들어오면 카메라를 켜고(핸드폰은 뒤 카메라 우선),
 * SCAN_INTERVAL_MS마다 영상 한 장을 jsQR(DEC-027)로 읽어 QR 문자열을 찾으면 `onDetect`로 넘긴다.
 * 읽은 문자열의 유효성·만료·중복 판단은 하지 않는다 — 전부 서버가 한다.
 * 페이지를 벗어나면 반복을 멈추고 카메라 트랙을 끈다. React 개발 모드(Strict Mode)에서 effect가
 * 두 번 실행돼도, 먼저 실행된 쪽의 카메라는 정리 단계에서 꺼지고 늦게 도착한 스트림도 바로 꺼진다.
 * `paused`가 true인 동안(결과 처리 중)에는 같은 QR을 반복해서 넘기지 않는다.
 */
export function useQrScanner({
  onDetect,
  paused,
}: {
  onDetect: (text: string) => void;
  paused: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<QrScannerStatus>("requesting");

  // 반복 작업 안에서 항상 최신 값을 쓰도록 ref에 담는다(바뀔 때마다 카메라를 다시 켜지 않기 위해).
  const onDetectRef = useRef(onDetect);
  const pausedRef = useRef(paused);
  useEffect(() => {
    onDetectRef.current = onDetect;
    pausedRef.current = paused;
  }, [onDetect, paused]);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      // 카메라 API가 없는 브라우저 — 즉시 실패로 표시한다(파생 상태 아님).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("error");
      return;
    }

    let cancelled = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    const scanOnce = () => {
      const video = videoRef.current;
      if (!video || !context || pausedRef.current) return;
      if (video.readyState < video.HAVE_ENOUGH_DATA || !video.videoWidth) {
        return;
      }
      const scale = Math.min(1, MAX_SCAN_WIDTH / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const image = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(image.data, image.width, image.height, {
        inversionAttempts: "dontInvert",
      });
      if (code?.data) onDetectRef.current(code.data);
    };

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      })
      .then((nextStream) => {
        if (cancelled) {
          nextStream.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = nextStream;
        if (videoRef.current) videoRef.current.srcObject = nextStream;
        setStatus("scanning");
        timer = setInterval(scanOnce, SCAN_INTERVAL_MS);
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return { videoRef, status };
}
