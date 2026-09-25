"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConsentAllRow } from "./ConsentAllRow";
import { ConsentItem } from "./ConsentItem";
import { PrimaryButton } from "./PrimaryButton";

type ConsentKey = "privacy" | "face";

// REQ-AUTH-004 항목표. 문구는 화면 예시이며 최종 전문은 학교 제공 문안에 연결한다.
// Figma의 선택 항목 `기숙사 공지 알림 수신`은 공지 기능 제거(2026-09-26, REQ-SCOPE-003)로 두지 않는다.
const CONSENT_ITEMS: {
  key: ConsentKey;
  title: string;
  description: string;
  required: boolean;
}[] = [
  {
    key: "privacy",
    title: "개인정보 수집 및 이용 동의",
    description:
      "이름, 학번, 호실, 얼굴 특징 정보를 출석 확인 목적으로 수집합니다.",
    required: true,
  },
  {
    key: "face",
    title: "얼굴 정보 처리 동의",
    description:
      "등록한 얼굴 정보는 출석 인증에만 사용되며 졸업 시 파기됩니다.",
    required: true,
  },
];

/**
 * 학생 개인정보 동의 화면(REQ-AUTH-004). 핸드폰(Figma 605:5)은 버튼을 하단에 두고,
 * 노트북(md 이상, Figma 사용자-노트북 605:52)은 가운데 520px 덩어리 안에 버튼까지 넣는다.
 * 처음에는 모두 꺼진 상태로 시작한다(사용자 결정 — Figma의 필수 2개 선택은 예시 상태).
 * 서버가 아직 없어 동의 결과는 저장하지 않고 얼굴 등록(/face)으로만 이동한다.
 */
export function StudentConsent() {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<ConsentKey, boolean>>({
    privacy: false,
    face: false,
  });

  const allChecked = CONSENT_ITEMS.every((item) => checked[item.key]);
  const canContinue = CONSENT_ITEMS.every(
    (item) => !item.required || checked[item.key],
  );

  const toggleAll = () => {
    const next = !allChecked;
    setChecked({ privacy: next, face: next });
  };

  const toggleItem = (key: ConsentKey) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <main className="flex min-h-dvh flex-col bg-[#f5f5f7] px-[18px] pb-7 pt-[43px] md:items-center md:justify-center md:bg-admin-bg md:p-0">
      <div className="flex flex-1 flex-col justify-between md:w-[520px] md:flex-none md:justify-start md:gap-2.5">
        <div className="flex flex-col gap-1.5 md:gap-2.5">
          <h1 className="text-lg font-bold leading-normal text-admin-text md:text-[22px]">
            서비스 이용에 동의해 주세요
          </h1>
          <p className="text-[11px] leading-normal text-admin-textMuted md:text-[13px]">
            출석 확인을 위해 아래 항목에 동의가 필요합니다.
          </p>
          <ConsentAllRow checked={allChecked} onToggle={toggleAll} />
          <div className="h-px w-full bg-admin-border" />
          <div className="flex flex-col gap-2 pt-3.5 md:pt-4">
            {CONSENT_ITEMS.map((item) => (
              <ConsentItem
                key={item.key}
                title={item.title}
                description={item.description}
                required={item.required}
                checked={checked[item.key]}
                onToggle={() => toggleItem(item.key)}
              />
            ))}
          </div>
        </div>
        <PrimaryButton
          disabled={!canContinue}
          onClick={() => router.push("/face")}
        >
          동의하고 계속하기
        </PrimaryButton>
      </div>
    </main>
  );
}
