// 설치 가능한 앱 셸만 지원한다(DEC-022). 정적 자산(JS/CSS/아이콘)만 캐시하고,
// 그 외 모든 요청(페이지 네비게이션 포함)은 캐시를 거치지 않고 네트워크로 보낸다 —
// 출석·얼굴 인식 등 데이터 응답은 절대 캐시하지 않는다.

const CACHE_NAME = "app-shell-v1";
const CACHEABLE_PREFIXES = ["/_next/static/", "/icons/"];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

function isCacheableStaticAsset(url) {
  return (
    url.origin === self.location.origin &&
    CACHEABLE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
  );
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (!isCacheableStaticAsset(url)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    }),
  );
});
