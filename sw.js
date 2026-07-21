// 아이담다 PWA service worker
const CACHE = 'hanbeone-v5';
const CORE = [
  '/app.html', '/day.html', '/month.html', '/grade.html', '/index.html', '/pair.html',
  '/notifications.js', '/pwa.js', '/profiles.js', '/sync.js', '/menu.js', '/welcomeback.js', '/alarmsound.js',
  '/app.webmanifest', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 네트워크 우선, 실패 시 캐시 (정적 앱이 자주 업데이트되므로 항상 최신 우선)
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || !r.url.startsWith(self.location.origin)) return;
  // HTML 문서(화면 이동)는 브라우저 HTTP 캐시를 건너뛰고 항상 최신을 받게 강제 → 업데이트 밀림 방지
  const isDoc = r.mode === 'navigate' || (r.headers.get('accept') || '').indexOf('text/html') !== -1;
  const fetchReq = isDoc ? new Request(r.url, { cache: 'no-store' }) : r;
  e.respondWith(
    fetch(fetchReq)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(r, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(r).then((hit) => hit || caches.match('/app.html')))
  );
});

// 알림 클릭 → 앱 열기 (해당 날짜가 있으면 그 날짜로)
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const date = e.notification.data && e.notification.data.date;
  const target = date ? ('/day.html?date=' + date) : '/app.html';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) { c.navigate(target); return c.focus(); }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
