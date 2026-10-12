"use client";

import Link from "next/link";
import { ModeToggle } from "@/components/admin/ModeToggle";
import { useScreenMode } from "@/lib/admin/use-screen-mode";

const ROW =
  "flex min-h-[77px] w-full items-center justify-between rounded-[20px] bg-admin-surface px-[23px] py-[21px] text-[19px] leading-normal text-admin-text";

/**
 * 관리자 마이페이지(Figma 09, 노드 1289:25). 프로필 카드, `얼굴 등록`, `화면 모드`로 이루어진다.
 * - `얼굴 등록`은 학생과 같은 순서로 개인정보 동의(`/consent`)를 거쳐 얼굴 등록으로 간다(사용자 결정 2026-10-12).
 * - `화면 모드`는 해/달 토글이다(`useScreenMode`).
 * 컴퓨터 기준 내용 폭 800px, 위 여백 113px이고 좁은 화면에서는 폭을 줄이고 여백을 줄인다.
 */
export function AdminMyPage() {
  const { mode, changeMode } = useScreenMode();

  return (
    <div className="flex w-full flex-col items-center px-4 pb-7 pt-6 md:px-[22px] md:pt-12 xl:px-8 xl:pt-[113px]">
      <div className="flex w-full max-w-[800px] flex-col gap-[25px]">
        <section
          aria-label="프로필"
          className="flex w-full flex-col gap-[5px] rounded-[25px] bg-admin-surface p-[35px]"
        >
          <h1 className="text-[28px] font-bold leading-normal tracking-[-0.56px] text-admin-text">
            관리자
          </h1>
          <p className="text-lg leading-normal text-admin-textMuted">
            DataGSM 계정으로 로그인됨
          </p>
        </section>

        <nav aria-label="마이페이지 메뉴" className="flex flex-col gap-[13px]">
          <Link
            href="/consent"
            className={`${ROW} transition-colors hover:bg-admin-rowSurface`}
          >
            <span>얼굴 등록</span>
            <span aria-hidden="true" className="text-[#b9b9be]">
              ›
            </span>
          </Link>
          <div className={ROW}>
            <span>화면 모드</span>
            <ModeToggle mode={mode} onChange={changeMode} />
          </div>
        </nav>
      </div>
    </div>
  );
}
