/**
 * 브라우저는 같은 출처의 `/api/*`만 호출하고, Next가 Spring 서버로 넘긴다.
 * 세션 쿠키가 같은 출처로 오가서 CORS 설정이 필요 없다(#64).
 * `API_PROXY_TARGET`은 서버에서만 읽는 값이라 `NEXT_PUBLIC_`을 붙이지 않는다.
 */
const apiProxyTarget = process.env.API_PROXY_TARGET ?? "http://localhost:8080";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 저장소 공용 web/AGENTS.md에 Next.js가 자체 에이전트 안내 블록을 덧붙이지 않게 막는다.
  agentRules: false,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
