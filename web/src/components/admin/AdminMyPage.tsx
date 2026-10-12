"use client";

import Link from "next/link";
import { ModeToggle } from "@/components/ModeToggle";
import { useTheme } from "@/lib/theme";

const ROW_CLASS =
  "flex min-h-[62px] w-full items-center justify-between rounded-2xl bg-admin-surface text-[15px] leading-normal xl:min-h-[77px] xl:rounded-[20px] xl:text-[19px]";

/**
 * 관리자 마이페이지(REQ-UI-005·008, Figma `09 · 마이페이지`: 핸드폰 1292:33 · 패드 1289:233 · 컴퓨터 1289:25).
 * 프로필(`관리자` · `DataGSM 계정으로 로그인됨`, Figma 고정 문구) 아래 `얼굴 등록`과 `화면 모드` 줄이 있다.
 * 핸드폰은 흰 헤더에 제목 `마이페이지`를 함께 두고, 패드(폭 500px)·컴퓨터(폭 800px)는 제목 없이 흰 카드를 가운데에 쌓는다.
 * 컴퓨터는 글자·줄·토글(60×35)이 모두 1.25배쯤 크다.
 *
 * `얼굴 등록`이 가는 곳은 Figma에 없어 이미 있는 얼굴 등록 화면(`/face`, 다시 등록 방식)으로 보내고 끝나면 여기로 돌아온다(DEC-074).
 * 핸드폰 헤더 위 여백은 다른 관리자 화면처럼 Figma의 가짜 상태바를 뺀 14px이다.
 */
export function AdminMyPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-full w-full flex-col md:items-center md:px-[22px] md:pb-6 md:pt-[102px] xl:px-8 xl:pb-7 xl:pt-[113px]">
      <div className="flex w-full flex-col md:max-w-[500px] md:gap-5 xl:max-w-[800px] xl:gap-[25px]">
        <section className="bg-admin-surface px-[22px] pb-[22px] pt-3.5 md:rounded-[20px] md:p-7 xl:rounded-[25px] xl:p-[35px]">
          <h1 className="pb-5 text-[27px] font-bold leading-normal tracking-[-0.81px] text-admin-text md:sr-only">
            마이페이지
          </h1>
          <div className="flex flex-col gap-[5px] leading-normal md:gap-1 xl:gap-[5px]">
            <p className="text-2xl font-bold tracking-[-0.48px] text-admin-text md:text-[22px] md:tracking-[-0.44px] xl:text-[28px] xl:tracking-[-0.56px]">
              관리자
            </p>
            <p className="text-sm text-admin-textMuted xl:text-lg">
              DataGSM 계정으로 로그인됨
            </p>
          </div>
        </section>

        <div className="flex flex-col gap-2.5 px-[18px] py-4 md:p-0 xl:gap-[13px]">
          <Link
            href="/face?reset=1&from=admin"
            className={`${ROW_CLASS} p-[18px] transition-colors hover:bg-admin-divider xl:p-[23px]`}
          >
            <span className="text-admin-text">얼굴 등록</span>
            <span
              aria-hidden="true"
              className="text-[#b9b9be] dark:text-admin-textFaint"
            >
              ›
            </span>
          </Link>
          <div
            className={`${ROW_CLASS} px-[18px] py-[17px] xl:px-[23px] xl:py-[21px]`}
          >
            <span className="text-admin-text">화면 모드</span>
            <button
              type="button"
              role="switch"
              aria-checked={theme === "dark"}
              aria-label="다크 모드"
              onClick={toggleTheme}
              className="shrink-0 rounded-full"
            >
              <ModeToggle className="h-7 w-12 xl:h-[35px] xl:w-[60px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
