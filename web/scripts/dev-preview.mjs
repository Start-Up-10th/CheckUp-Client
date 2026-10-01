// 로그인·서버 없이 관리자 화면을 폭별로 보는 개발 서버. 환경 변수만 넣어 `next dev`를 띄운다.
// 추가 인자는 그대로 넘긴다. 예: npm run dev:preview -- -p 3100
import { spawn } from "node:child_process";

const child = spawn("npx", ["next", "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NEXT_PUBLIC_ADMIN_PREVIEW: "true" },
});

child.on("exit", (code) => process.exit(code ?? 0));
