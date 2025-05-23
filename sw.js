const CACHE = 'static-v1';

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only watch your CSS/JS or HTML
  if (url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.js')  ||
      url.pathname.endsWith('.html')) {

    event.respondWith((async () => {
      // Try cache first
      const cache = await caches.open(CACHE);
      const cached = await cache.match(event.request);
      if (cached) {
        // Serve from cache, but still go to network in the background
        fetch(event.request).then(async resp => {
          if (resp.ok) {
            // Update cache for next time
            await cache.put(event.request, resp.clone());
            // Notify clients that we got a fresh copy
            const clients = await self.clients.matchAll();
            for (const client of clients) {
              client.postMessage({
                url: url.pathname,
                from: 'network'
              });
            }
          }
        }).catch(() => {/* offline or error */});
        return cached;
      }

      // No cache: do full fetch
      const response = await fetch(event.request);
      if (response.ok) {
        cache.put(event.request, response.clone());
        // Notify clients immediately
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
  }
});
