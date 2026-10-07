import {
  DATAGSM_BUTTON_CLASS,
  DataGsmButtonContent,
} from "@/components/LoginCard";

/** REQ-AUTH-001 `DataGSM으로 계속하기` 버튼. 관리자 로그인과 같은 모양이다(`LoginCard`). */
export function DataGsmLoginButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={DATAGSM_BUTTON_CLASS}>
      <DataGsmButtonContent />
    </button>
  );
}
