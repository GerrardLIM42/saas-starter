const CACHE_NAME = "moriva-demo-shell-v1";
const SHELL_ASSETS = ["/moriva-favicon.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// 홈 화면에 설치된 앱으로 인식되도록 하는 최소 서비스워커.
// 오프라인 캐싱은 정적 셸 자산만 대상으로 하고, 그 외 요청은 항상 네트워크를 그대로 사용한다.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (!SHELL_ASSETS.includes(url.pathname)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
