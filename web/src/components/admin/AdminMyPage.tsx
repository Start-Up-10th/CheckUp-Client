"use client";

import Link from "next/link";
import { ModeToggle } from "@/components/admin/ModeToggle";
import { useScreenMode } from "@/lib/admin/use-screen-mode";

const ROW =
  "flex min-h-[62px] w-full items-center justify-between rounded-2xl bg-admin-surface p-[18px] text-[15px] leading-normal text-admin-text xl:min-h-[77px] xl:rounded-[20px] xl:px-[23px] xl:py-[21px] xl:text-[19px]";

/**
 * 관리자 마이페이지(Figma 09: 컴퓨터 1289:25, 패드 1289:233, 핸드폰 1292:33). 프로필, `얼굴 등록`, `화면 모드`다.
 * - 핸드폰: 흰 머리(`마이페이지` 제목 + 프로필)와 그 아래 메뉴 줄이 화면 폭을 채운다.
 * - 패드: 위 여백 102에 폭 500의 프로필 카드와 메뉴. 컴퓨터: 위 여백 113에 폭 800.
 * - `얼굴 등록`은 학생과 같은 순서로 개인정보 동의(`/consent`)를 거쳐 얼굴 등록으로 간다(사용자 결정 2026-10-12).
 * - `화면 모드`는 해/달 토글이다(`useScreenMode`).
 */
export function AdminMyPage() {
  const { mode, changeMode } = useScreenMode();

  return (
    <div className="flex w-full flex-col md:items-center md:px-[22px] md:pb-6 md:pt-[102px] xl:px-8 xl:pb-7 xl:pt-[113px]">
      <div className="flex w-full flex-col md:max-w-[500px] md:gap-5 xl:max-w-[800px] xl:gap-[25px]">
        <section
          aria-label="프로필"
          className="bg-admin-surface px-[22px] pb-[22px] pt-1 md:rounded-[20px] md:p-7 xl:rounded-[25px] xl:p-[35px]"
        >
          <h1 className="pb-5 text-[27px] font-bold leading-normal tracking-[-0.81px] text-admin-text md:sr-only">
            마이페이지
          </h1>
          <div className="flex flex-col gap-[5px] md:gap-1 xl:gap-[5px]">
            <h2 className="text-2xl font-bold leading-normal tracking-[-0.48px] text-admin-text md:text-[22px] md:tracking-[-0.44px] xl:text-[28px] xl:tracking-[-0.56px]">
              관리자
            </h2>
            <p className="text-sm leading-normal text-admin-textMuted xl:text-lg">
              DataGSM 계정으로 로그인됨
            </p>
          </div>
        </section>

        <nav
          aria-label="마이페이지 메뉴"
          className="flex flex-col gap-2.5 px-[18px] py-4 md:p-0 xl:gap-[13px]"
        >
          <Link
            href="/consent"
            className={`${ROW} transition-colors hover:bg-admin-rowSurface`}
          >
            <span>얼굴 등록</span>
            <span aria-hidden="true" className="text-[#b9b9be]">
              ›
            </span>
          </Link>
          <div className={`${ROW} py-[17px] xl:py-[21px]`}>
            <span>화면 모드</span>
            <ModeToggle mode={mode} onChange={changeMode} />
          </div>
        </nav>
      </div>
    </div>
  );
}
