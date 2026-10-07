"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bounce,
  ToastContainer,
  toast as notify,
  type ToastOptions,
  type ToastTransitionProps,
  type TypeOptions,
} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * 토스트는 `react-toastify`를 쓴다(사용자 결정 2026-10-07, DEC-048). Figma 상태 메시지 모양 대신 라이브러리 기본 모양이다.
 * 표시 시간 규칙은 그대로다(노션 기능명세서 `로그인 성공 안내`): 성공·안내 2초, 오류 4초. 닫기 버튼은 라이브러리 기본을 쓴다.
 */
const TOAST_DURATION_MS: Record<ToastMessage["variant"], number> = {
  success: 2000,
  neutral: 2000,
  error: 4000,
};

export type ToastMessage = {
  variant: "success" | "error" | "neutral";
  message: string;
};

/** 우리 종류를 react-toastify 종류로 바꾼다(안내는 `info`). */
const TYPE: Record<ToastMessage["variant"], TypeOptions> = {
  success: "success",
  error: "error",
  neutral: "info",
};

/** 스크린 리더 역할: 오류는 바로 읽는 알림(`alert`), 성공·안내는 정중한 상태 안내(`status`)다(REQ-UI-006). */
const ROLE: Record<ToastMessage["variant"], string> = {
  success: "status",
  neutral: "status",
  error: "alert",
};

/** 상태가 풀릴 때까지 유지하는 단일 토스트(얼굴 인식·QR 생성·QR 스캔 결과)가 쓰는 고정 id. */
const SINGLE_TOAST_ID = "single";

function show(next: ToastMessage) {
  const id = `${next.variant}:${next.message}`;
  const options: ToastOptions = {
    toastId: id,
    type: TYPE[next.variant],
    role: ROLE[next.variant],
    autoClose: TOAST_DURATION_MS[next.variant],
  };
  // 같은 문구가 이미 떠 있으면 새로 쌓지 않고 시간만 다시 센다.
  if (notify.isActive(id)) {
    notify.update(id, { ...options, render: next.message });
  } else {
    notify(next.message, options);
  }
}

/**
 * 애니메이션 없이 바로 나타나고 사라지는 전환. OS의 `동작 줄이기`를 켠 사용자와 애니메이션이 없는 환경(테스트)에서 쓴다.
 * 기본 전환은 애니메이션이 끝나야 토스트를 지워서, 애니메이션이 없으면 닫아도 화면에 남는다.
 */
function InstantTransition({
  children,
  isIn,
  done,
  playToast,
}: ToastTransitionProps) {
  useEffect(() => {
    if (isIn) playToast();
    else done();
  }, [isIn, done, playToast]);
  return <>{children}</>;
}

function prefersInstant(): boolean {
  if (typeof window === "undefined") return false;
  return (
    typeof window.matchMedia !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * 화면 위쪽 가운데에 잠깐 떴다 사라지는 상태 메시지(REQ-UI-006). 새 토스트는 이전 것을 지우지 않고 쌓이며 각자 자기 시간이
 * 지나면 따로 사라진다(`ToastLayer`의 `stacked`). 같은 문구를 다시 띄우면 하나만 남고 시간만 다시 센다.
 */
export function useToast() {
  const showToast = useCallback((next: ToastMessage) => show(next), []);
  return { showToast };
}

/**
 * 토스트가 그려지는 자리(`ToastContainer`). 화면마다 하나만 둔다. 위치는 위쪽 가운데(핸드폰·패드·컴퓨터 공통, 노치는
 * 라이브러리가 `safe-area-inset-top`으로 피한다)이고, 여러 개는 쌓아서 맨 앞이 가장 새 것이며 마우스를 올리면(터치는
 * 눌러서) 펼쳐진다. 최대 5개다.
 * `toast`는 상태가 풀릴 때까지 유지하는 단일 토스트다(얼굴 인식·QR 생성·QR 스캔 결과): 문구가 바뀌면 그 자리에서
 * 바뀌고, null이 되면 닫힌다.
 */
export function ToastLayer({ toast = null }: { toast?: ToastMessage | null }) {
  const variant = toast?.variant;
  const message = toast?.message;

  useEffect(() => {
    if (!variant || message === undefined) {
      notify.dismiss(SINGLE_TOAST_ID);
      return;
    }
    const options: ToastOptions = {
      toastId: SINGLE_TOAST_ID,
      type: TYPE[variant],
      role: ROLE[variant],
      autoClose: false,
    };
    if (notify.isActive(SINGLE_TOAST_ID)) {
      notify.update(SINGLE_TOAST_ID, { ...options, render: message });
    } else {
      notify(message, options);
    }
  }, [variant, message]);

  // 화면을 떠나면 이 화면의 토스트를 모두 지운다.
  useEffect(() => () => notify.dismiss(), []);

  const [instant] = useState(prefersInstant);

  return (
    <ToastContainer
      position="top-center"
      stacked
      limit={5}
      transition={instant ? InstantTransition : Bounce}
    />
  );
}
