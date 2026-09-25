/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 저장소 공용 web/AGENTS.md에 Next.js가 자체 에이전트 안내 블록을 덧붙이지 않게 막는다.
  agentRules: false,
};

export default nextConfig;
