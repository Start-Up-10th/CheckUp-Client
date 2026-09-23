"use client";

import { useEffect, useRef, useState } from "react";

export type CameraStatus = "requesting" | "granted" | "error";

/**
 * REQ-FACE-004: 관리자 카메라 세션 — 시작 버튼 없이 페이지 진입 시 자동 실행하고,
 * 페이지를 벗어나면(언마운트) 카메라 트랙을 정리한다. 허용 전에는 LIVE를 표시하지 않는다.
 */
export function useCameraStream() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<CameraStatus>("requesting");

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      // 브라우저가 카메라 API 자체를 지원하지 않는 드문 환경을 위한 즉시 실패 처리(파생 상태 아님).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("error");
      return;
    }

    let cancelled = false;
    let activeStream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus("granted");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      activeStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return { videoRef, status };
}
