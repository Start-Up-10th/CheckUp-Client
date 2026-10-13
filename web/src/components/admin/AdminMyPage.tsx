"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FaceReRegisterDialog } from "@/components/admin/FaceReRegisterDialog";
import { ToastLayer, useToast } from "@/components/admin/Toast";
import { ModeToggle } from "@/components/ModeToggle";
import { MaskIcon } from "@/components/student/MaskIcon";
import { useAdminLogout } from "@/lib/admin/use-admin-logout";
import { failureNotice } from "@/lib/rate-limit";
import {
  FaceLoginRequiredError,
  FaceNotStudentError,
  fetchFaceStatus,
} from "@/lib/student/face-enroll-api";
import { useTheme } from "@/lib/theme";

const NOT_STUDENT_MESSAGE = "학생 정보가 없는 계정은 얼굴을 등록할 수 없어요.";
const FACE_DONE_MESSAGE = "얼굴 등록을 마쳤어요.";
const STATUS_FAILED_MESSAGE =
  "얼굴 등록 상태를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.";

const ROW =
  "flex min-h-[62px] w-full items-center justify-between rounded-2xl bg-admin-surface p-[18px] text-[15px] leading-[18px] text-admin-text xl:min-h-[77px] xl:rounded-[20px] xl:px-[23px] xl:py-[21px] xl:text-[19px] xl:leading-[23px]";

/**
 * 관리자 마이페이지(Figma 09: 컴퓨터 1289:25, 패드 1289:233, 핸드폰 1292:33). 프로필, `얼굴 등록`, `화면 모드`다.
 * - 핸드폰: 학생 마이페이지(Figma 6:2)와 같다. 흰 머리(위 여백 60 = 상태바 56 + 4, `마이페이지` 제목 + 프로필)와
 *   그 아래 메뉴 줄이 화면 폭을 채우고, 맨 아래에 `로그아웃`이 있다(패드·컴퓨터는 레일·사이드바에 있어 숨긴다).
 * - 패드: 위 여백 102에 폭 500의 프로필 카드와 메뉴. 컴퓨터: 위 여백 113에 폭 800.
 * - `얼굴 등록`은 학생과 같은 순서로 개인정보 동의(`/consent`)를 거쳐 얼굴 등록으로 간다(사용자 결정 2026-10-12).
 *   누르면 먼저 서버에서 얼굴 등록 상태를 확인한다(`GET /api/v1/face/me`). 이미 등록했으면 `다시 등록하시겠습니까?`
 *   확인 창을 보이고(`뒤로가기`는 이 화면에 머묾, `다음`은 동의 → 다시 등록), 아직이면 바로 동의로 간다. 어느 쪽이든
 *   `from=admin`을 붙여 끝난 뒤 학생 홈이 아니라 이 화면으로 돌아온다(DEC-079).
 * - `화면 모드`는 공용 해/달 토글이다(`lib/theme`, REQ-UI-008). 관리자 화면은 항상 라이트라 학생 화면의 모드를 바꾼다.
 */
export function AdminMyPage({
  faceDone = false,
}: {
  /** 얼굴 등록 흐름을 마치고 돌아왔다(`?face=done`). 성공 토스트를 한 번 보이고 주소에서 표시를 지운다(페이지를 다시 만들지 않고). */
  faceDone?: boolean;
}) {
  const { theme, toggleTheme } = useTheme();
  const logout = useAdminLogout();
  const router = useRouter();
  const { showToast } = useToast();
  const [checking, setChecking] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // 상태 확인이 끝나기 전의 중복 누름을 막는다.
  const inFlight = useRef(false);

  // Strict Mode(개발)가 효과를 두 번 돌리면 토스트 컨테이너 정리가 첫 토스트를 지우고 두 번째가 다시 띄운다. 같은 문구는
  // 토스트가 하나로 합치므로 여러 번 불러도 한 번만 보인다.
  useEffect(() => {
    if (!faceDone) return;
    showToast({ variant: "success", message: FACE_DONE_MESSAGE });
    // `router.replace`는 검색어가 바뀌어 페이지를 다시 만들고, 그러면 토스트 컨테이너가 정리되며 방금 띄운 토스트가
    // 닫힌다. 페이지를 다시 만들지 않는 `history.replaceState`로 주소의 표시만 지운다(새로고침해도 다시 안 뜬다).
    window.history.replaceState(null, "", "/admin/mypage");
  }, [faceDone, showToast]);

  async function startFaceRegistration() {
    if (inFlight.current) return;
    inFlight.current = true;
    setChecking(true);
    try {
      const { enrolled } = await fetchFaceStatus();
      if (enrolled) setConfirmOpen(true);
      else router.push("/consent?from=admin");
    } catch (error) {
      if (error instanceof FaceLoginRequiredError) {
        router.replace("/admin/login");
      } else if (error instanceof FaceNotStudentError) {
        showToast({ variant: "error", message: NOT_STUDENT_MESSAGE });
      } else {
        showToast(failureNotice(error, STATUS_FAILED_MESSAGE));
      }
    } finally {
      inFlight.current = false;
      setChecking(false);
    }
  }

  return (
    <div className="flex min-h-full w-full flex-col md:items-center md:px-[22px] md:pb-6 md:pt-[102px] xl:px-8 xl:pb-7 xl:pt-[113px]">
      <ToastLayer />
      <div className="flex w-full flex-1 flex-col md:max-w-[500px] md:flex-none md:gap-5 xl:max-w-[800px] xl:gap-[25px]">
        <section
          aria-label="프로필"
          className="bg-admin-surface px-[22px] pb-[22px] pt-[60px] md:rounded-[20px] md:p-7 xl:rounded-[25px] xl:p-[35px]"
        >
          <h1 className="pb-5 text-[27px] font-bold leading-8 tracking-[-0.81px] text-admin-text md:sr-only">
            마이페이지
          </h1>
          <div className="flex flex-col gap-[5px] md:gap-1 xl:gap-[5px]">
            <h2 className="text-2xl font-bold leading-[29px] tracking-[-0.48px] text-admin-text md:text-[22px] md:leading-[26px] md:tracking-[-0.44px] xl:text-[28px] xl:leading-[34px] xl:tracking-[-0.56px]">
              관리자
            </h2>
            <p className="text-sm leading-[17px] text-admin-textMuted xl:text-lg xl:leading-[22px]">
              DataGSM 계정으로 로그인됨
            </p>
          </div>
        </section>

        <nav
          aria-label="마이페이지 메뉴"
          className="flex flex-1 flex-col gap-2.5 px-[18px] py-4 md:flex-none md:p-0 xl:gap-[13px]"
        >
          <button
            type="button"
            aria-haspopup="dialog"
            aria-busy={checking}
            disabled={checking}
            onClick={startFaceRegistration}
            className={`${ROW} text-left hover:bg-admin-divider active:bg-admin-divider disabled:opacity-60`}
          >
            <span>얼굴 등록</span>
            <span
              aria-hidden="true"
              className="text-[#b9b9be] dark:text-admin-textFaint"
            >
              ›
            </span>
          </button>
          <div className={`${ROW} py-[17px] xl:py-[21px]`}>
            <span>화면 모드</span>
            <button
              type="button"
              role="switch"
              aria-checked={theme === "dark"}
              aria-label="화면 모드"
              onClick={toggleTheme}
              className="shrink-0 origin-right rounded-full xl:scale-125"
            >
              <ModeToggle />
            </button>
          </div>
          <div className="flex-1 md:hidden" />
          <button
            type="button"
            onClick={logout}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-admin-danger-border bg-admin-danger-bg px-[18px] text-[15px] font-medium leading-normal text-admin-danger-text transition-colors hover:bg-admin-danger-border md:hidden"
          >
            <MaskIcon
              src="/icons/student-nav/logout.svg"
              className="size-[18px]"
            />
            로그아웃
          </button>
        </nav>
      </div>
      {confirmOpen ? (
        <FaceReRegisterDialog
          onBack={() => setConfirmOpen(false)}
          onNext={() => router.push("/consent?reset=1&from=admin")}
        />
      ) : null}
    </div>
  );
}
