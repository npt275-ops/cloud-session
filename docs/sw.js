// Bể Kính: lưu cả game vào máy ở lần mở đầu tiên, những lần sau chơi được khi không có mạng.
const CACHE = 'bekinh-a39a890849';
const FILES = ["./", "HUONG-DAN.txt", "audio.js", "chaos3d.js", "clouds3d.js", "fauna3d.js", "god3d.js", "icons/apple-touch-icon.png", "icons/favicon-32.png", "icons/favicon-64.png", "icons/icon-192.png", "icons/icon-512.png", "index.html", "landmarks3d.js", "lands3d.js", "manifest.webmanifest", "powers3d.js", "sights3d.js", "sim.js", "sky3d.js", "story3d.js", "streets3d.js", "vendor/LICENSE-fonts.txt", "vendor/LICENSE-three.txt", "vendor/OrbitControls.js", "vendor/fonts.css", "vendor/fonts/fraunces-0511eb67.woff2", "vendor/fonts/fraunces-39ce2001.woff2", "vendor/fonts/fraunces-79671606.woff2", "vendor/fonts/outfit-35708376.woff2", "vendor/fonts/outfit-35e12df6.woff2", "vendor/three.min.js", "war3d.js"];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('bekinh-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request)));
});
