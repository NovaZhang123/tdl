// Service Worker - 工作TDL 离线缓存
const CACHE_NAME = 'tdl-cache-v2';  // 版本升级，强制清除旧缓存
const ASSETS = [
  './tdl.html',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://html2canvas.hertzen.com/dist/html2canvas.min.js',
];

// 安装：预缓存所有资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(() => console.warn('Cache miss:', url)))
      );
    })
  );
  self.skipWaiting();
});

// 激活：清理所有旧版本缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('删除旧缓存:', k);
          return caches.delete(k);
        })
      )
    )
  );
  self.clients.claim();
});

// 请求拦截：网络优先，失败时才用缓存（确保每次都能拿到最新版本）
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 网络请求成功，更新缓存
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // 离线时才用缓存
        return caches.match(event.request).then(cached => {
          return cached || caches.match('./tdl.html');
        });
      })
  );
});
