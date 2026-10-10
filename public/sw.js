const CACHE = "palleride-v2";
const SHELL = ["/", "/logo.png", "/manifest.webmanifest"];
const PUBLIC_API = ["/api/trips", "/api/cars", "/api/rentals"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => null)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

function isPublicGet(url) {
  if (url.pathname.startsWith("/api/driver") || url.pathname.startsWith("/api/admin")) return false;
  return PUBLIC_API.some((p) => url.pathname === p || url.pathname.startsWith(p + "/"));
}

function cachePut(req, res) {
  if (res.ok) {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
  }
}

// Network-first with cache fallback (fresh data is what matters on a rides network).
function networkFirst(req) {
  return fetch(req)
    .then((res) => {
      cachePut(req, res);
      return res;
    })
    .catch(() =>
      caches.match(req).then((hit) => {
        if (hit) return hit;
        if (req.mode === "navigate") return caches.match("/");
        return Response.error();
      })
    );
}

// Cache-first with background refresh for immutable-looking build assets.
function staleWhileRevalidate(req) {
  return caches.match(req).then((hit) => {
    const refresh = fetch(req)
      .then((res) => {
        cachePut(req, res);
        return res;
      })
      .catch(() => hit);
    return hit || refresh;
  });
}

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;

  if (e.request.mode === "navigate") {
    // Full page loads: live data when online, offline fallback when not.
    e.respondWith(networkFirst(e.request));
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    // Only anonymous public feeds are cached. Private endpoints (driver,
    // admin, reports, account) are network-only: phone numbers, tokens and
    // booking details must never be written to a shared cache.
    e.respondWith(isPublicGet(url) ? networkFirst(e.request) : fetch(e.request));
    return;
  }

  if (url.pathname.startsWith("/_next/")) {
    e.respondWith(staleWhileRevalidate(e.request));
    return;
  }

  // Other static/public assets: cache-first via the shell or networkFirst.
  e.respondWith(networkFirst(e.request));
});