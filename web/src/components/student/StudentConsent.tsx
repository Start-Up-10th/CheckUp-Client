"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBanner } from "@/components/admin/StatusBanner";
import {
  ConsentLoginRequiredError,
  ConsentNotStudentError,
  submitConsent,
} from "@/lib/student/consent-api";
import { ConsentAllRow } from "./ConsentAllRow";
import { ConsentItem } from "./ConsentItem";
import { PrimaryButton } from "./PrimaryButton";

type ConsentKey = "privacy" | "face" | "notice";

// REQ-AUTH-004 항목표. 문구는 화면 예시이며 최종 전문은 학교 제공 문안에 연결한다.
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
  {
    key: "notice",
    title: "기숙사 공지 알림 수신",
    description: "공지사항과 출석 관련 알림을 받아볼 수 있습니다.",
    required: false,
  },
];

/** 저장 실패 종류. server는 다시 시도할 수 있고, notStudent(403)는 다시 시도해도 같다. */
type ConsentError = "server" | "notStudent";

const ERROR_MESSAGES: Record<ConsentError, string> = {
  server: "서버와 연결이 원활하지 않습니다.",
  notStudent: "학생 계정만 이용할 수 있어요.",
};

/**
 * 학생 개인정보 동의 화면(REQ-AUTH-004). 핸드폰(Figma 605:5)은 버튼을 하단에 두고,
 * 노트북(md 이상, Figma 사용자-노트북 605:52)은 가운데 520px 덩어리 안에 버튼까지 넣는다.
 * 처음에는 모두 꺼진 상태로 시작한다(사용자 결정 — Figma의 필수 2개 선택은 예시 상태).
 * `동의하고 계속하기`를 누르면 서버에 동의를 저장하고(`POST /api/v1/consent`) 얼굴 등록(/face)으로 간다.
 * 로그인이 안 돼 있으면(401) 로그인 화면으로 보낸다. 저장이 실패하면 Figma에 저장 실패 문구가 없어
 * 학생 홈 서버 오류와 같은 `서버와 연결이 원활하지 않습니다.`를 같은 자리(핸드폰 아래, 노트북 오른쪽 위)에
 * 보여 주고, 다시 누를 수 있게 한다. 저장하는 동안에는 버튼을 막아 두 번 보내지 않는다.
 * 학생이 아닌 계정(403, 교사 등)은 다시 눌러도 결과가 같으므로 `학생 계정만 이용할 수 있어요.`를 보여 주고
 * 버튼을 막는다(Figma에 없어 QR 화면의 학생 아님 문구와 같은 말투로 정함).
 */
export function StudentConsent() {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<ConsentKey, boolean>>({
    privacy: false,
    face: false,
    notice: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ConsentError | null>(null);

  const allChecked = CONSENT_ITEMS.every((item) => checked[item.key]);
  const canContinue = CONSENT_ITEMS.every(
    (item) => !item.required || checked[item.key],
  );

  const toggleAll = () => {
    const next = !allChecked;
    setChecked({ privacy: next, face: next, notice: next });
  };

  const toggleItem = (key: ConsentKey) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const agree = () => {
    setSaving(true);
    setError(null);
    submitConsent({
      privacy: checked.privacy,
      face: checked.face,
      noticeAlarm: checked.notice,
    })
      .then(() => router.push("/face"))
      .catch((reason: unknown) => {
        if (reason instanceof ConsentLoginRequiredError) {
          router.push("/login");
          return;
        }
        if (reason instanceof ConsentNotStudentError) {
          setError("notStudent");
          return;
        }
        setSaving(false);
        setError("server");
      });
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
        <PrimaryButton disabled={!canContinue || saving} onClick={agree}>
          동의하고 계속하기
        </PrimaryButton>
      </div>
      {error && (
        <div className="pointer-events-none fixed inset-x-[18px] bottom-[104px] z-40 md:inset-x-auto md:bottom-auto md:right-8 md:top-8 md:w-[380px]">
          <StatusBanner variant="error" message={ERROR_MESSAGES[error]} />
        </div>
      )}
    </main>
  );
}
