var staticCacheName = 'spwapp-static-v1';
var contentImgsCache = 'spwapp-content-imgs';
var allCaches = [staticCacheName, contentImgsCache];


self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        '/',
        '/index.html',
        '/settings.html',
        '/avatars.html',
        '/idb.js',
        '/functions.js',
        '/images/icons/home.png',
        '/images/icons/offline.png',
        '/images/icons/settings.png',
        '/images/icons/icon.png',
        ]);
    })
  );
});

// whenever a new sw is activated with a bumped up cache version
// we delete the old version caches
self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (cacheNames) {
    return Promise.all(cacheNames.filter(function (cacheName) {
      return cacheName.startsWith('spwapp-') && !allCaches.includes(cacheName);
    }).map(function (cacheName) {
      return caches['delete'](cacheName);
    }));
  }));
});

self.addEventListener('fetch', function(event) {

  var requestUrl = new URL(event.request.url);

  // if (requestUrl.origin === location.origin) {  }

  // if sky photos then cache them using serverPhoto fn
  // skysports photo are served from 365dm.com
  if (requestUrl.href.includes(".jpg") && 
      requestUrl.href.includes("365dm")) {
    event.respondWith(servePhoto(event.request));
    return;
  }

  // test avatar cache stratedgy
  if (requestUrl.href.includes('webtask.io')) {
    // event.respondWith(serveAvatar(event.request));
    event.respondWith(serveAvatarFromNetworkFirst(event.request));
    return;
  }

  // the rest of fetches, search in cache and fallback to network
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );

});


self.addEventListener('push', function(event) {
  console.log('Push message received', event);
  event.waitUntil(
    self.registration.showNotification('Got Push?', {
      body: 'Push Message received'
   }));
});





// self.addEventListener('fetch', function (event) {
//   var requestUrl = new URL(event.request.url);

//   if (requestUrl.origin === location.origin) {
//     if (requestUrl.pathname === '/') {
//       event.respondWith(caches.match('/skeleton'));
//       return;
//     }
//     if (requestUrl.pathname.includes(".jpg") && 
//         requestUrl.pathname.includes("skysports")) {
//       event.respondWith(servePhoto(event.request));
//       return;
//     }
//   }

//   event.respondWith(caches.match(event.request).then(function (response) {
//     return response || fetch(event.request);
//   }));
// });

function servePhoto(request) {

  var storageUrl = request.url.replace(/\.jpg\?\d+/, '.jpg');

  return caches.open(contentImgsCache).then(function (cache) {
    return cache.match(storageUrl).then(function (response) {
      if (response) return response;

      return fetch(request).then(function (networkResponse) {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}

function serveAvatarFromNetworkFirst(request) {
  // When the network fetch fails, that's when we look up in cache
  var storageUrl = request.url;

  console.log("serving A from NETWORK!!", request.url);

  return fetch(request).then(function(networkResponse){
    return caches.open(contentImgsCache).then(function(cache) {
      cache.put(storageUrl, networkResponse.clone());
      return networkResponse;
    })
  }).catch(function() {
    return caches.match(request);
  })
}

function serveAvatar(request) {
  // Note that this is slightly different to servePhoto!
  var storageUrl = request.url;

  console.log("serving avatars", request.url);

  return caches.open(contentImgsCache).then(function(cache) {
    return cache.match(storageUrl).then(function(response) {

      var networkFetch = fetch(request).then(function(networkResponse) {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });

      return response || networkFetch;
    });
  });  
}