import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
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
      colors: {
        admin: {
          bg: "#f2f2f3",
          surface: "#ffffff",
          rowSurface: "#f6f6f7",
          divider: "#ebebed",
          border: "#e3e3e5",
          text: "#1c1c1e",
          textMuted: "#8e8e93",
          textFaint: "#a5a5aa",
          textSecondary: "#6e6e73",
          attendance: {
            bg: "#f4fbe2",
            border: "#dcefad",
            text: "#4e7010",
            textMuted: "#6b8f22",
          },
          absence: {
            bg: "#f2f2f3",
            border: "#e3e3e5",
            text: "#8e8e93",
          },
          danger: {
            bg: "#fdeceb",
            border: "#f3cfcb",
            text: "#c0392b",
          },
          // 스타일 가이드(343:141/145) 버튼 변형: 저장류 Accent, 취소/닫기류 Ghost.
          accent: {
            bg: "#b9ee84",
            text: "#17200a",
          },
          ghost: {
            bg: "#f4f4f5",
            text: "#3a3a3c",
          },
        },
      },
      // 토스트 등장·퇴장: 위에서 살짝 내려오며 나타나고, 사라질 때는 위로 올라가며 흐려진다.
      keyframes: {
        "toast-in": {
          from: { opacity: "0", transform: "translateY(-12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "toast-out": {
          from: { opacity: "1", transform: "translateY(0)" },
          to: { opacity: "0", transform: "translateY(-12px)" },
        },
      },
      animation: {
        "toast-in": "toast-in 200ms ease-out both",
        "toast-out": "toast-out 200ms ease-in both",
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
