// Bể Kính: lưu cả game vào máy ở lần mở đầu tiên, những lần sau chơi được khi không có mạng.
const CACHE = 'bekinh-3f73f3d65f';
const FILES = ["./", "HUONG-DAN.txt", "audio.js", "clouds3d.js", "icons/apple-touch-icon.png", "icons/favicon-32.png", "icons/favicon-64.png", "icons/icon-192.png", "icons/icon-512.png", "index.html", "lands3d.js", "logic/eras.js", "logic/rules.js", "manifest.webmanifest", "render/build/kit3d.js", "render/build/plains/common.js", "render/build/plains/e01.js", "render/build/plains/e02.js", "render/build/plains/e03.js", "render/build/plains/e04.js", "render/build/plains/e05.js", "render/build/plains/e06.js", "render/build/plains/e07.js", "render/build/plains/e08.js", "render/build/plains/e09.js", "render/build/plains/e10.js", "render/build/plains/e11.js", "render/build/plains/e12.js", "render/buildings3d.js", "sea3d.js", "vendor/LICENSE-fonts.txt", "vendor/LICENSE-three.txt", "vendor/OrbitControls.js", "vendor/fonts.css", "vendor/fonts/fraunces-0511eb67.woff2", "vendor/fonts/fraunces-39ce2001.woff2", "vendor/fonts/fraunces-79671606.woff2", "vendor/fonts/outfit-35708376.woff2", "vendor/fonts/outfit-35e12df6.woff2", "vendor/three.min.js"];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('bekinh-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // có mạng thì luôn lấy bản mới nhất rồi lưu lại; mất mạng mới dùng bản đã lưu (để vừa cập nhật là thấy ngay)
  e.respondWith(fetch(e.request).then((res) => { if (res && res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); } return res; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
