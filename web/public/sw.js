// 설치 가능한 앱 셸만 지원한다(DEC-024). 정적 자산(JS/CSS/아이콘)만 캐시하고,
// 그 외 모든 요청(페이지 네비게이션 포함)은 캐시를 거치지 않고 네트워크로 보낸다 —
// 출석·얼굴 인식 등 데이터 응답은 절대 캐시하지 않는다.

// 캐시 이름을 올리면 activate에서 옛 캐시가 모두 지워진다. 아이콘처럼 주소는 같고 내용이 바뀌는 파일을 고치고
// 예전 캐시를 꼭 비워야 할 때 올린다. (v2: 캐시 우선이던 아이콘이 옛 파일로 남던 문제를 고쳤다)
const CACHE_NAME = "app-shell-v2";
// `/_next/static/`은 파일 이름에 해시가 붙어 내용이 바뀌면 주소도 바뀌므로 캐시 우선이 안전하다.
const IMMUTABLE_PREFIX = "/_next/static/";
// `/icons/`는 주소가 같은 채 내용이 바뀔 수 있어 네트워크 우선이다. 오프라인일 때만 캐시를 쓴다.
const NETWORK_FIRST_PREFIX = "/icons/";

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

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (!isSameOrigin(url)) return;

  if (url.pathname.startsWith(IMMUTABLE_PREFIX)) {
    event.respondWith(cacheFirst(event.request));
  } else if (url.pathname.startsWith(NETWORK_FIRST_PREFIX)) {
    event.respondWith(networkFirst(event.request));
  }
});
