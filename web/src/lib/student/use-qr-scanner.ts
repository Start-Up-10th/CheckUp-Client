"use client";

import jsQR from "jsqr";
import { useCallback, useEffect, useRef, useState } from "react";

export type QrScannerStatus = "requesting" | "scanning" | "error";
/** 켤 카메라 방향. environment는 뒤 카메라, user는 앞 카메라다. */
type QrCameraFacing = "environment" | "user";

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
 * `enabled`가 false면 카메라를 켜지 않는다 — `/qr#t=<토큰>` 링크로 들어와 카메라 없이 바로
 * 제출하는 경우에 쓴다(하네스 DEC-018). 나중에 true가 되면 그때 카메라를 켠다.
 * `switchCamera`는 앞·뒤 카메라를 바꾼다(DEC-080). 켜져 있던 카메라를 끄고 반대 방향으로 다시 켠다.
 * 카메라가 둘 이상일 때만 `canSwitch`가 true다 — 카메라 수는 권한을 받은 뒤에야 알 수 있어 켠 다음에 센다.
 * 앞 카메라일 때는 `mirrored`가 true라 화면을 거울처럼 뒤집어 보인다(판독은 뒤집지 않은 원본 영상으로 한다).
 * 고른 방향은 저장하지 않아, 화면에 다시 들어오면 뒤 카메라부터 켠다.
 */
export function useQrScanner({
  onDetect,
  paused,
  enabled = true,
}: {
  onDetect: (text: string) => void;
  paused: boolean;
  enabled?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<QrScannerStatus>("requesting");
  const [facing, setFacing] = useState<QrCameraFacing>("environment");
  const [canSwitch, setCanSwitch] = useState(false);
  const [mirrored, setMirrored] = useState(false);

  // 반복 작업 안에서 항상 최신 값을 쓰도록 ref에 담는다(바뀔 때마다 카메라를 다시 켜지 않기 위해).
  const onDetectRef = useRef(onDetect);
  const pausedRef = useRef(paused);
  useEffect(() => {
    onDetectRef.current = onDetect;
    pausedRef.current = paused;
  }, [onDetect, paused]);

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
        video: { facingMode: { ideal: facing } },
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
        // 실제로 켜진 카메라가 앞 카메라일 때만 뒤집는다(노트북 웹캠은 방향 값이 없어 그대로 둔다).
        setMirrored(
          nextStream.getVideoTracks()[0]?.getSettings?.().facingMode === "user",
        );
        timer = setInterval(scanOnce, SCAN_INTERVAL_MS);
        navigator.mediaDevices
          .enumerateDevices?.()
          .then((devices) => {
            if (cancelled) return;
            const cameras = devices.filter(
              (device) => device.kind === "videoinput",
            );
            setCanSwitch(cameras.length > 1);
          })
          .catch(() => {});
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [enabled, facing]);

  const switchCamera = useCallback(() => {
    setFacing((current) =>
      current === "environment" ? "user" : "environment",
    );
  }, []);

  return { videoRef, status, canSwitch, mirrored, switchCamera };
}
