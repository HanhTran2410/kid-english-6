// Service worker: cache toàn bộ phần code để chạy offline.
// Mỗi lần sửa code: tăng VERSION (trùng APP_VERSION trong js/app.js) để máy tải bản mới.
// Thêm/bớt file trong app/ thì cập nhật ASSETS (test tests/unit/sw.test.js sẽ báo nếu thiếu).
// Thư viện bài app/shared/ (file .json + index.json) KHÔNG lưu offline: tải từ mạng khi bố mẹ mở Thư viện bài / chuông kiểm tra.

const VERSION = '0.3.2';
const CACHE = `kid-english-6-${VERSION}`;

const ASSETS = [
  './',
  'css/app.css',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'fonts/nunito-latin-700-normal.woff2',
  'fonts/nunito-latin-800-normal.woff2',
  'fonts/nunito-latin-ext-700-normal.woff2',
  'fonts/nunito-latin-ext-800-normal.woff2',
  'fonts/nunito-vietnamese-700-normal.woff2',
  'fonts/nunito-vietnamese-800-normal.woff2',
  'icons/icon.svg',
  'index.html',
  'js/app.js',
  'js/captions.js',
  'js/data/builtin-lessons.js',
  'js/read/spell-stages.js',
  'js/read/stages.js',
  'js/read/teacher.js',
  'js/screens/read.js',
  'js/speech/phoneme.js',
  'js/db.js',
  'js/image.js',
  'js/lesson-prompts.js',
  'js/lesson.js',
  'js/library.js',
  'js/main.js',
  'js/mascot.js',
  'js/notices.js',
  'js/match.js',
  'js/phonics.js',
  'js/progress.js',
  'js/screens/child.js',
  'js/screens/notice-bell.js',
  'js/screens/parent/common.js',
  'js/screens/parent/create.js',
  'js/screens/parent/index.js',
  'js/screens/parent/lessons.js',
  'js/session.js',
  'js/settings.js',
  'js/speech/listen.js',
  'js/speech/microphone.js',
  'js/speech/recognition.js',
  'js/speech/recorder.js',
  'js/speech/sfx.js',
  'js/speech/tts.js',
  'js/text.js',
  'js/timing.js',
  'js/ui.js',
  'js/zones.js',
  'manifest.webmanifest',
  'sounds/phonics/a.mp3',
  'sounds/phonics/ai.mp3',
  'sounds/phonics/ar.mp3',
  'sounds/phonics/b.mp3',
  'sounds/phonics/ch.mp3',
  'sounds/phonics/d.mp3',
  'sounds/phonics/e.mp3',
  'sounds/phonics/ee.mp3',
  'sounds/phonics/er.mp3',
  'sounds/phonics/f.mp3',
  'sounds/phonics/g.mp3',
  'sounds/phonics/h.mp3',
  'sounds/phonics/i.mp3',
  'sounds/phonics/ie.mp3',
  'sounds/phonics/j.mp3',
  'sounds/phonics/k.mp3',
  'sounds/phonics/l.mp3',
  'sounds/phonics/m.mp3',
  'sounds/phonics/n.mp3',
  'sounds/phonics/ng.mp3',
  'sounds/phonics/o.mp3',
  'sounds/phonics/oa.mp3',
  'sounds/phonics/oi.mp3',
  'sounds/phonics/oo-l.mp3',
  'sounds/phonics/oo.mp3',
  'sounds/phonics/or.mp3',
  'sounds/phonics/ou.mp3',
  'sounds/phonics/p.mp3',
  'sounds/phonics/qu.mp3',
  'sounds/phonics/r.mp3',
  'sounds/phonics/s.mp3',
  'sounds/phonics/sh.mp3',
  'sounds/phonics/t.mp3',
  'sounds/phonics/th-v.mp3',
  'sounds/phonics/th.mp3',
  'sounds/phonics/u.mp3',
  'sounds/phonics/ue.mp3',
  'sounds/phonics/v.mp3',
  'sounds/phonics/w.mp3',
  'sounds/phonics/x.mp3',
  'sounds/phonics/y.mp3',
  'sounds/phonics/z.mp3',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS.map((a) => new Request(a, { cache: 'reload' })))));
  // Không skipWaiting ngay: bản mới chỉ áp dụng ở lần mở sau.
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('kid-english-6-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (request.mode === 'navigate') {
      return (await cache.match('index.html')) ?? fetch(request);
    }
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      return await fetch(request);
    } catch {
      return new Response('', { status: 504, statusText: 'Offline' });
    }
  })());
});
