// sw.js
const CACHE = 'assets-v1';

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (!url.pathname.match(/\.(css|js|html)$/)) {
    return; // ignore non-assets
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(event.request);

    if (cached) {
      // 1) Serve the cached response immediately
      // 2) In the background, revalidate
      setTimeout(async () => {
        const netResp = await fetch(event.request, { cache: 'no-cache' });
        if (netResp.status === 200) {
          // New content — update cache & notify as network
          await cache.put(event.request, netResp.clone());
          const clients = await self.clients.matchAll();
          for (const client of clients) {
            client.postMessage({
              url: url.pathname,
              from: 'network'
            });
          }
        } else if (netResp.status === 304) {
          // Not modified — notify as cache
          const clients = await self.clients.matchAll();
          for (const client of clients) {
            client.postMessage({
              url: url.pathname,
              from: 'cache'
            });
          }
        }
      }, 0);

      return cached;
    }

    // No cache yet: full network fetch, cache it, notify as network
    const response = await fetch(event.request);
    if (response.ok) {
      const clone = response.clone();
      await cache.put(event.request, clone);
      const clients = await self.clients.matchAll();
      for (const client of clients) {
        client.postMessage({
          url: url.pathname,
          from: 'network'
        });
      }
    }
    return response;
  })());
});
