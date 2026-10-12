import type { Config } from "tailwindcss";

/** globals.css의 `--admin-*` 변수(RGB 세 숫자)를 투명도(`/45`)까지 쓸 수 있는 색으로 만든다. */
function v(name: string) {
  return `rgb(var(--admin-${name}) / <alpha-value>)`;
}

const config: Config = {
  // 다크 모드는 <html data-theme="dark">일 때다(DEC-074). `dark:` 변형도 이 속성을 따른다.
  darkMode: ["selector", '[data-theme="dark"]'],
  // 터치 화면에서는 hover가 눌린 뒤에도 남아 보여서, 마우스가 있는 기기에서만 hover를 적용한다.
  future: { hoverOnlyWhenSupported: true },
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "bar-rise": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "bar-rise": "bar-rise 240ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "sans-serif",
        ],
        mono: ["var(--font-roboto-mono)", "monospace"],
      },
      // 색 값은 globals.css의 CSS 변수다. 라이트·다크 모드마다 값이 달라진다(DEC-074).
      colors: {
        admin: {
          bg: v("bg"),
          surface: v("surface"),
          rowSurface: v("row-surface"),
          divider: v("divider"),
          border: v("border"),
          text: v("text"),
          textMuted: v("text-muted"),
          textFaint: v("text-faint"),
          textSecondary: v("text-secondary"),
          attendance: {
            bg: v("attendance-bg"),
            border: v("attendance-border"),
            text: v("attendance-text"),
            textMuted: v("attendance-text-muted"),
          },
          absence: {
            bg: v("absence-bg"),
            border: v("absence-border"),
            text: v("absence-text"),
          },
          danger: {
            bg: v("danger-bg"),
            border: v("danger-border"),
            text: v("danger-text"),
          },
          // 스타일 가이드(343:141/145) 버튼 변형: 저장류 Accent, 취소/닫기류 Ghost.
          accent: {
            bg: v("accent-bg"),
            text: v("accent-text"),
          },
          ghost: {
            bg: v("ghost-bg"),
            text: v("ghost-text"),
          },
          // 배경과 반대 밝기의 꽉 찬 버튼(다시 시도). 라이트는 검정 바탕·흰 글자, 다크는 밝은 바탕·검은 글자다.
          solid: {
            bg: v("solid-bg"),
            bgHover: v("solid-bg-hover"),
            text: v("solid-text"),
          },
          // 모드와 상관없이 어두운 화면(QR 카메라, 어두운 사이드바). 값이 바뀌지 않는다.
          ink: "#1c1c1e",
        },
      },
      borderRadius: {
        card: "14px",
        panel: "20px",
        control: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
