"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MenuRow } from "./MenuRow";
import { StudentConfirmDialog } from "./StudentConfirmDialog";

/**
 * 마이페이지 `얼굴 재설정` 메뉴(DEC-067). 촬영 화면(`/face?reset=1`)은 들어가자마자 3·2·1 자동 촬영이 시작돼 준비할 틈이
 * 없으므로, 누르면 먼저 확인 창으로 안내한다(#356, DEC-105). `다시 등록`만 촬영 화면으로 가고 `취소`는 마이페이지에 머문다.
 * 관리자 마이페이지 `얼굴 등록`(`from=admin`, DEC-090)은 따로 자기 확인 창을 써서 여기와 상관없다.
 */
export function FaceResetMenuRow() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <MenuRow label="얼굴 재설정" onClick={() => setConfirming(true)} />
      {confirming && (
        <StudentConfirmDialog
          title="얼굴을 다시 등록할까요?"
          description="촬영 화면으로 가면 3초 뒤 자동으로 촬영해요. 얼굴이 화면에 잘 보이게 준비해 주세요. 다시 등록하면 기존 얼굴이 새 얼굴로 바뀌어요."
          confirmLabel="다시 등록"
          onCancel={() => setConfirming(false)}
          onConfirm={() => router.push("/face?reset=1")}
        />
      )}
    </>
  );
}
