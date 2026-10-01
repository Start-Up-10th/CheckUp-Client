const SCREENS = {
  duty: {
    label: "06 · 봉사자 관리",
    src: "/admin/state-demo/pad-frame/volunteer-duty",
  },
  roster: {
    label: "07 · 봉사자 명단 편집",
    src: "/admin/state-demo/pad-frame/volunteer-roster",
  },
} as const;

// 로그인 없이 패드(768px) 화면을 보는 확인용 페이지. 창 크기와 상관없이 폭 768px 프레임 안에서
// 패드 레이아웃(레일 포함)으로 보인다. 쿼리 `?screen=roster`로 07을 연다.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ screen?: string }>;
}) {
  const { screen } = await searchParams;
  const current = screen === "roster" ? "roster" : "duty";

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 bg-[#e8e8e9] p-6">
      <nav className="flex gap-2 text-sm">
        {(Object.keys(SCREENS) as (keyof typeof SCREENS)[]).map((key) => (
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
        ))}
      </nav>
      <iframe
        key={current}
        title={`패드 확인용 · ${SCREENS[current].label}`}
        src={SCREENS[current].src}
        className="box-content h-[1024px] w-[768px] rounded-[24px] border-[10px] border-[#c8c8ca] bg-white shadow-lg"
      />
      <p className="text-xs text-admin-textMuted">
        폭 768px 프레임이라 창 크기와 상관없이 패드 레이아웃으로 보입니다.
        프레임 안에서 06 ↔ 07 이동과 지정·완료를 해 볼 수 있고, 레일의 다른
        메뉴는 로그인이 필요한 실제 화면으로 갑니다.
      </p>
    </div>
  );
}
