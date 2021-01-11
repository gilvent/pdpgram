importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');
importScripts('/lib/workbox-v5.1.4/workbox-sw.js');

workbox.setConfig({modulePathPrefix: '/lib/workbox-v5.1.4/'});

const StaleWhileRevalidate = workbox.strategies.StaleWhileRevalidate;
const ExpirationPlugin = workbox.expiration.ExpirationPlugin;

workbox.routing.registerRoute(
  new RegExp(/.*(?:firebasestorage\.googleapis)\.com.*$/),
  new StaleWhileRevalidate({
    cacheName: 'post-images'
  })
)

workbox.routing.registerRoute(
  new RegExp(/.*(?:googleapis|gstatic)\.com.*$/),
  new StaleWhileRevalidate({
    cacheName: 'google-fonts',
    plugins: [
      new ExpirationPlugin({
        // Only cache requests for a month
        maxAgeSeconds: 30 * 24 * 60 * 60,
        // Only cache 3 requests.
        maxEntries: 3,
      })
    ]
  })
);

workbox.routing.registerRoute(
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
  new StaleWhileRevalidate({
    cacheName: 'material-css'
  })
);

/**
 * Use custom handler to store posts to indexed db
 */
workbox.routing.registerRoute(
  'https://pdpgram.firebaseio.com/posts.json',
  async ({url, request, event, params}) => {
    return fetch(request)
      .then(function(res) {
        const clonedRes = res.clone();
        clearIndexedDBData('posts')
          .then(() => {
            return clonedRes.json();
          })
          .then(data => {
            for (let key in data) {
              writeToIndexedDB('posts', data[key]);
            }
          });
        return res;
      })
  }
)

/** 
 * Display fallback offline.html if failing to get any html file
 */
workbox.routing.registerRoute(
  ({ url, request, event }) => {
    return request.headers.get('Accept').includes('text/html');
  },
  async ({ url, request, event, params }) => {
    return caches.match(request)
      .then(function(response) {
        if (response) {
          return response;
        } else {
          return fetch(request)
            .then(function(res) {
              return caches.open('dynamic')
                .then(function(cache) {
                  cache.put(request.url, res.clone());
                  return res;
                })
            })
            .catch(function(err) {
              const cacheKey = workbox.precaching.getCacheKeyForURL('/offline.html')
              return caches.match(cacheKey)
                .then(function(res) {
                  return res;
                })
            });
        }
      })
  }
)

/**
 * Precache routes based on workbox-config
 */
workbox.precaching.precacheAndRoute([{"revision":"0a27a4163254fc8fce870c8cc3a3f94f","url":"404.html"},{"revision":"2cab47d9e04d664d93c8d91aec59e812","url":"favicon.ico"},{"revision":"0aded70d12e9309557ebc381a993b0f8","url":"index.html"},{"revision":"292540f6dfbf73613fee69c4daa34768","url":"lib/workbox-v5.1.4/workbox-background-sync.dev.js"},{"revision":"1477337d11af8f727e9203690ef10cfc","url":"lib/workbox-v5.1.4/workbox-background-sync.prod.js"},{"revision":"c8aec116b72d5a6f4fbdf895cbe9a6a2","url":"lib/workbox-v5.1.4/workbox-broadcast-update.dev.js"},{"revision":"3b28d76111687065750273c7ac7f4c97","url":"lib/workbox-v5.1.4/workbox-broadcast-update.prod.js"},{"revision":"22b01a882fa59ca2dc95581a863d6543","url":"lib/workbox-v5.1.4/workbox-cacheable-response.dev.js"},{"revision":"baa5a06eb89620c714728d9292895824","url":"lib/workbox-v5.1.4/workbox-cacheable-response.prod.js"},{"revision":"4da76fb060d4145b55f770ef2ba1916e","url":"lib/workbox-v5.1.4/workbox-core.dev.js"},{"revision":"2002e39bc413245e9466646856a3a1a0","url":"lib/workbox-v5.1.4/workbox-core.prod.js"},{"revision":"2b6ecefe6b4de33b232b1d4f3f6f2d4d","url":"lib/workbox-v5.1.4/workbox-expiration.dev.js"},{"revision":"3c39521fc764b9952c819c8be6bdee40","url":"lib/workbox-v5.1.4/workbox-expiration.prod.js"},{"revision":"79bf2718a2ad92bc4b16e90df9a6813e","url":"lib/workbox-v5.1.4/workbox-navigation-preload.dev.js"},{"revision":"b08e45df331d747386f7a9d3ce8d6f35","url":"lib/workbox-v5.1.4/workbox-navigation-preload.prod.js"},{"revision":"3bfac87afd96631ca169f1580340bb09","url":"lib/workbox-v5.1.4/workbox-offline-ga.dev.js"},{"revision":"291d35c6a2d5e4e63240804f3da93dff","url":"lib/workbox-v5.1.4/workbox-offline-ga.prod.js"},{"revision":"fe30d3ca56741cc350362b551cc81ea6","url":"lib/workbox-v5.1.4/workbox-precaching.dev.js"},{"revision":"aad79f6fd69e76afce9a9bc0444fb4b1","url":"lib/workbox-v5.1.4/workbox-precaching.prod.js"},{"revision":"0aba977d2b293ce947ace319edfff93f","url":"lib/workbox-v5.1.4/workbox-range-requests.dev.js"},{"revision":"05a4f56357fc7bc48478d8048df4f0e3","url":"lib/workbox-v5.1.4/workbox-range-requests.prod.js"},{"revision":"eb2ee6155e0c721707d9fa05e4590f28","url":"lib/workbox-v5.1.4/workbox-routing.dev.js"},{"revision":"65baaf497738a14f1b694a9cff829d4d","url":"lib/workbox-v5.1.4/workbox-routing.prod.js"},{"revision":"929f436eeb0effe772037b7afb8ab1db","url":"lib/workbox-v5.1.4/workbox-strategies.dev.js"},{"revision":"2a12ac7e1932c797cb3084c2543066c9","url":"lib/workbox-v5.1.4/workbox-strategies.prod.js"},{"revision":"1ebc21ea730f92a3ea3e2698f9449a65","url":"lib/workbox-v5.1.4/workbox-streams.dev.js"},{"revision":"e1ce8b87604c3265fcca4504f1b97814","url":"lib/workbox-v5.1.4/workbox-streams.prod.js"},{"revision":"dc277aae8a000c27df99aba092aa1832","url":"lib/workbox-v5.1.4/workbox-sw.js"},{"revision":"80d6025c59787e3fbdbd4e55ef08d7f3","url":"lib/workbox-v5.1.4/workbox-window.dev.umd.js"},{"revision":"a416894a85a10c88abd525b50d27ffed","url":"lib/workbox-v5.1.4/workbox-window.prod.umd.js"},{"revision":"c94735c4196003b5c82c1f536f79ee53","url":"manifest.json"},{"revision":"6f43a3924d7efdce9689376011f0628f","url":"offline.html"},{"revision":"ffed0d57e450481d115a3e1eaccfe002","url":"src/css/app.css"},{"revision":"b7386312fdc9ebc0fe4dcfdbaa881475","url":"src/css/feed.css"},{"revision":"81922f16d60bd845fd801a889e6acbd7","url":"src/css/help.css"},{"revision":"d95b1ac0254e9c7bbd41221ef5a9cc2b","url":"src/js/app.js"},{"revision":"9304234bec1462968e142c87cad81e68","url":"src/js/feed.js"},{"revision":"a368dece9f9a713eea5f20964679bf1e","url":"src/js/fetch.js"},{"revision":"edfbee0bb03a5947b5a680c980ecdc9f","url":"src/js/idb.js"},{"revision":"e68511951f1285c5cbf4aa510e8a2faf","url":"src/js/material.min.js"},{"revision":"b824449b966ea6229ca6d31b53abfcc1","url":"src/js/promise.js"},{"revision":"bff72cf3ee34e2bbefceb393eb592b74","url":"src/js/utility.js"},{"revision":"25f2f2d3fb9345e76a55a8a121077352","url":"sw.js"},{"revision":"104536ce72429ec1f598883183de70b7","url":"workbox-69b5a3b7.js"},{"revision":"31b19bffae4ea13ca0f2178ddb639403","url":"src/images/main-image-lg.jpg"},{"revision":"c6bb733c2f39c60e3c139f814d2d14bb","url":"src/images/main-image-sm.jpg"},{"revision":"5c66d091b0dc200e8e89e56c589821fb","url":"src/images/main-image.jpg"},{"revision":"0f282d64b0fb306daf12050e812d6a19","url":"src/images/sf-boat.jpg"}]);


/**
 * Use custom implementation for background sync and push notification
 */
self.addEventListener('sync', function(event) {
  console.log('[Service Worker] Background Syncing', event);

  const storePostUrl = 'https://us-central1-pdpgram.cloudfunctions.net/storePost'

  if (event.tag === 'sync-new-posts') {
    console.log('[Service Worker] Syncing new posts');
    event.waitUntil(
      readFromIndexedDB('sync-posts')
        .then(function(data) {
          for (let dt of data) {
            let formData = new FormData();
            formData.append('id', dt.id);
            formData.append('title', dt.title);
            formData.append('location', dt.location);
            formData.append('file', dt.picture, dt.id + '.png');
            formData.append('rawLocationLat', dt.rawLocation.lat);
            formData.append('rawLocationLng', dt.rawLocation.lng);

            fetch(storePostUrl, {
              method: 'POST',
              body: formData
            }).then(function(res) {
              if (res.ok) {
                deleteIndexedDBData('sync-posts', dt.id);
              }
            }).catch(function(err) {
              console.log('Error while saving post to server', err);
            })
          }
        })
    )
  }
})

self.addEventListener('notificationclick', function(event) {
  const notification = event.notification;
  const action = event.action;

  console.log(notification);

  if (action === 'confirm') {
    console.log('Confirm clicked');
  } else {
    event.waitUntil(
      clients.matchAll()
        .then(function(clients) {
          const client = clients.find(function(c) {
            return c.visibilityState === 'visible';
          });
          
          if (client) {
            client.navigate(notification.data.url);
            client.focus();
          } else {
            clients.openWindow(notification.data.url);
          }
          notification.close();
        })
    );
    console.log(action);
  }
})

self.addEventListener('notificationclose', function(event) {
  console.log(event);
})

self.addEventListener('push', function(event) {
  console.log('Push notification received', event);
  let data = {
    title: 'New!',
    content: 'Something new happened!',
    url: '/'
  };
  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  const options = {
    body: data.content,
    icon: '/src/images/icons/app-icon-96x96.png',
    badge: '/src/images/icons/app-icon-96x96.png',
    data: {
      url: data.openUrl
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})