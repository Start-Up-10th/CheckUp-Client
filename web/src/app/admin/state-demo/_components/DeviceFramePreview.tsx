const DEVICES = {
  pad: { label: "패드", width: 768, height: 1024, radius: "rounded-[24px]" },
  phone: { label: "핸드폰", width: 390, height: 844, radius: "rounded-[44px]" },
} as const;

const SCREENS = {
  duty: {
    label: "06 · 봉사자 관리",
    src: "/admin/state-demo/preview-frame/volunteer-duty",
  },
  roster: {
    label: "07 · 봉사자 명단 편집",
    src: "/admin/state-demo/preview-frame/volunteer-roster",
  },
} as const;

export type PreviewDevice = keyof typeof DEVICES;

/**
 * 로그인 없이 관리자 화면을 기기 폭 프레임 안에서 보는 확인용 페이지. 프레임(iframe)의 안쪽 폭이 기기 폭이라
 * 브라우저 창 크기와 상관없이 그 기기의 레이아웃으로 보인다. 테두리는 폭에 포함하지 않는다(box-content).
 */
export function DeviceFramePreview({
  device,
  screen,
}: {
  device: PreviewDevice;
  screen: string | undefined;
}) {
  const current = screen === "roster" ? "roster" : "duty";
  const frame = DEVICES[device];
  const links = (Object.keys(SCREENS) as (keyof typeof SCREENS)[]).map(
    (key) => (
      <a
        key={key}
        href={`?screen=${key}`}
        className={`rounded-full px-4 py-2 ${
          key === current
            ? "bg-admin-accent-bg font-bold text-admin-accent-text"
            : "bg-white text-admin-textSecondary"
        }`}
      >
        {SCREENS[key].label}
      </a>
    ),
  );

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 bg-[#e8e8e9] p-6">
      <nav className="flex flex-wrap items-center justify-center gap-2 text-sm">
        <a
          href={`/admin/state-demo/${device === "pad" ? "phone" : "pad"}?screen=${current}`}
          className="rounded-full bg-[#17200a] px-4 py-2 font-bold text-white"
        >
          {device === "pad" ? "핸드폰으로 보기" : "패드로 보기"}
        </a>
        {links}
      </nav>
      <iframe
        key={`${device}-${current}`}
        title={`${frame.label} 확인용 · ${SCREENS[current].label}`}
        src={SCREENS[current].src}
        style={{ width: frame.width, height: frame.height }}
        className={`box-content ${frame.radius} border-[10px] border-[#c8c8ca] bg-white shadow-lg`}
      />
      <p className="max-w-[640px] text-center text-xs text-admin-textMuted">
        폭 {frame.width}px 프레임이라 창 크기와 상관없이 {frame.label}{" "}
        레이아웃으로 보입니다. 프레임 안에서 06 ↔ 07 이동과 지정·완료를 해 볼 수
        있고, 하단 메뉴·레일의 다른 항목은 로그인이 필요한 실제 화면으로 갑니다.
      </p>
    </div>
  );
}
