"use client";

import Link from "next/link";

type AdminContentStateProps =
  | { variant: "empty"; description?: string }
  | { variant: "error"; onRetry: () => void }
  | { variant: "auth"; loginHref?: string };

const ICON: Record<string, string> = {
  empty: "/icons/state-empty.svg",
  error: "/icons/state-error.svg",
  auth: "/icons/state-auth.svg",
};

const ICON_BG: Record<string, string> = {
  empty: "bg-admin-bg",
  error: "bg-admin-danger-bg",
  auth: "bg-admin-attendance-bg",
};

const TITLE: Record<string, string> = {
  empty: "아직 데이터가 없어요",
  error: "불러오지 못했어요",
  auth: "로그인이 필요해요",
};

const DESCRIPTION: Record<string, string> = {
  error: "네트워크 연결을 확인하고\n다시 시도해 주세요.",
  auth: "이 페이지를 보려면\n먼저 로그인해 주세요.",
};

/**
 * REQ-UI-006: 관리자 화면 공통 상태 — 빈 상태·오류·로그인 필요 시 본문 자리를
 * 대신한다. 사이드바·헤더는 그대로 유지하고 본문 패널 안에서 중앙 정렬한다.
 * (Figma '상태 컴포넌트' 페이지 admin/empty · admin/error · admin/auth 275:55~84)
 */
export function AdminContentState(props: AdminContentStateProps) {
  const { variant } = props;

  return (
    <div
      role={variant === "error" ? "alert" : undefined}
      className="flex min-h-[300px] w-full flex-1 flex-col items-center justify-center gap-4 text-center leading-normal"
    >
      <span
        className={`flex size-[72px] items-center justify-center rounded-full ${ICON_BG[variant]}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ICON[variant]}
          alt=""
          aria-hidden="true"
          width={32}
          height={32}
          className="size-8"
        />
      </span>

      <div className="flex flex-col items-center gap-1.5">
        <p className="text-[19px] font-bold text-admin-text">
          {TITLE[variant]}
        </p>
        {variant === "empty" && props.description ? (
          <p className="whitespace-pre-line text-sm text-admin-textMuted">
            {props.description}
          </p>
        ) : variant !== "empty" ? (
          <p className="whitespace-pre-line text-sm text-admin-textMuted">
            {DESCRIPTION[variant]}
          </p>
        ) : null}
      </div>

      {variant === "error" && (
        <button
          type="button"
          onClick={props.onRetry}
          className="rounded-control bg-admin-text px-6 py-[13px] text-[15px] font-medium text-white"
        >
          다시 시도
        </button>
      )}

      {variant === "auth" && (
        <Link
          href={props.loginHref ?? "/admin/login"}
          className="rounded-control bg-admin-accent-bg px-6 py-[13px] text-[15px] font-medium text-admin-accent-text"
        >
          로그인하기
        </Link>
      )}
    </div>
  );
}
