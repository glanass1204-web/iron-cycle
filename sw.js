// Offline support for «Железный цикл». Bump VERSION on every release so phones pick up the new page.
var VERSION = 'iron-v14';
var CORE = ['./', './index.html', './about.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-512-maskable.png', './icon-180.png', './fonts/Phosphor.woff2'];
var PHOTOS = ['./img/arnold.jpg', './img/haney.jpg', './img/yates.png', './img/coleman.jpg', './img/cutler.jpg', './img/heath.jpg', './img/zane.jpg', './img/jackson.jpg', './img/rhoden.jpg', './img/levrone.jpg', './img/wheeler.jpg', './img/bigramy.jpg', './img/choopan.jpg', './img/lunsford.jpg', './img/bumstead.jpg', './img/ferrigno.jpg', './img/maddox.jpg', './img/kazmaier.jpg', './img/malanichev.jpg', './img/pudzianowski.jpg', './img/savickas.jpg', './img/shaw.jpg', './img/hall.jpg', './img/bjornsson.jpg', './img/vlasov.jpg', './img/alekseyev.jpg'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CORE).then(function () { return c.addAll(PHOTOS).catch(function () {}); }); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('iron-') === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  // The page itself: network first so updates arrive, cache when offline.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put('./index.html', copy); });
      return res;
    }).catch(function () { return caches.match('./index.html'); }));
    return;
  }

  // Fonts, champion photos and own files: cache first, refresh in the background.
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com|unpkg\.com|upload\.wikimedia\.org|telegram\.org/.test(url.host)) {
    e.respondWith(caches.open(VERSION).then(function (c) {
      return c.match(req).then(function (hit) {
        var net = fetch(req).then(function (res) { if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone()); return res; }).catch(function () { return hit; });
        return hit || net;
      });
    }));
  }
});
