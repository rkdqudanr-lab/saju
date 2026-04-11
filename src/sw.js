/**
 * 별숨 커스텀 서비스 워커 (injectManifest 전략)
 * - Workbox precaching + runtime caching
 * - Web Push 알림 이벤트 처리
 */

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

// ── Precaching ──
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ── Runtime Caching ──

// API: NetworkFirst (오류 응답 캐시 방지)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 3600 }),
    ],
  })
);

// CDN 리소스: CacheFirst
registerRoute(
  ({ url }) => url.host === 'cdn.jsdelivr.net',
  new CacheFirst({
    cacheName: 'cdn-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 86400 * 30 }),
    ],
  })
);

// Navigation: NetworkFirst (SPA fallback)
registerRoute(
  new NavigationRoute(
    new NetworkFirst({ cacheName: 'html-cache' }),
    { denylist: [/^\/api\//] }
  )
);

// ── Push Notifications ──
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || '별숨';
  const options = {
    body:  data.body  || '오늘의 별 기운이 도착했어요',
    icon:  '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag:   data.tag   || 'byeolsoom-push',
    renotify: true,
    data: { url: data.url ?? '/' },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
