"use client";

import { useEffect, useRef, useState } from "react";

export type FaceCameraStatus = "requesting" | "ready" | "error";

/**
 * REQ-FACE-001 학생 휴대폰 얼굴 등록 카메라. 화면에 들어오면 셔터 없이 바로 앞 카메라를 켜고,
 * 화면을 벗어나면(언마운트) 트랙을 끈다. Strict Mode에서 effect가 두 번 실행돼도 늦게 도착한
 * 스트림은 바로 꺼진다.
 * 이 훅은 영상을 화면에 보여 주기만 하고 프레임을 캡처·저장·전송하지 않는다 — 프레임 추출과
 * 서버 전송(POST /api/v1/face/registration)은 얼굴 등록 계약이 정해진 뒤 붙이며, 그때도 원본은
 * 메모리에서만 쓰고 즉시 폐기한다(REQ-FACE-002).
 */
export function useFaceCamera({ enabled }: { enabled: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<FaceCameraStatus>("requesting");

  useEffect(() => {
    if (!enabled) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      // 카메라 API가 없는 브라우저 — 즉시 실패로 표시한다(파생 상태 아님).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("error");
      return;
    }

    let cancelled = false;
    let stream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((nextStream) => {
        if (cancelled) {
          nextStream.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = nextStream;
        if (videoRef.current) videoRef.current.srcObject = nextStream;
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [enabled]);

  return { videoRef, status };
}
