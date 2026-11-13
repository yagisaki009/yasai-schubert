/* オフライン用：一度ひらいたら端末に保存して、電波がなくても動くようにする */
var CACHE = 'yasai-schubert-v12';
var FILES = ['./', 'index.html', 'art.js', 'music.js', 'bg.png', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    /* 同じサイトのほかのアプリの保存データは消さない。自分の古い版だけ消す */
    var mine = CACHE.replace(/v\d+$/, '');
    return Promise.all(keys.map(function (k) { if (k !== CACHE && k.indexOf(mine) === 0) return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(req, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok && res.status === 200 && req.url.indexOf(self.location.origin) === 0) c.put(req, res.clone());
        return res;
      });
      if (hit) { net['catch'](function () {}); return hit; }
      return net['catch'](function () { return c.match('index.html'); });
    });
  }));
});
