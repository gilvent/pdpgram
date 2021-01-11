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
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);


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