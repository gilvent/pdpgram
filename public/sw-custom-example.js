importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

let CACHE_STATIC_NAME = 'static-v42';
let CACHE_DYNAMIC_NAME = 'dynamic-v3';
let STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/idb.js',
  '/src/js/promise.js',
  '/src/js/fetch.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

// function trimCache(cacheName, maxItems) {
//   caches.open(cacheName)
//     .then(function(cache) {
//       return cache.keys()
//         .then(function(keys) {
//           if (keys.length > maxItems) {
//             cache.delete(keys[0])
//             .then(trimCache(cacheName, maxItems));
//           }
//         });
//     })

// }

self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing Service Worker ...', event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
      .then(function(cache) {
        console.log('[Service Worker] Precaching App Shell');
        cache.addAll(STATIC_FILES);
      })
  )
})

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating Service Worker ...', event);
  event.waitUntil(
    caches.keys()
      .then(function(keyList) {
        return Promise.all(keyList.map(key => {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log('[Service Worker] Removing old cache.', key);
            return caches.delete(key);
          }
        }))
      })
  )
  return self.clients.claim();
})

/**
 * Cache Strategy: Cache then network
 */
self.addEventListener('fetch', function(event) {
  const url = 'https://pdpgram.firebaseio.com/posts';
  
  if (event.request.url.includes(url)) {
    event.respondWith(
      fetch(event.request)
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
    )
  } else if (STATIC_FILES.includes(event.request.url)) {
    event.respondWith(
      caches.match(event.request)
    )
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          if (response) {
            return response;
          } else {
            return fetch(event.request)
              .then(function(res) {
                return caches.open(CACHE_DYNAMIC_NAME)
                  .then(function(cache) {
                    // trimCache(CACHE_DYNAMIC_NAME, 3);
                    cache.put(event.request.url, res.clone());
                    return res;
                  })
              })
              .catch(function(err) {
                return caches.open(CACHE_STATIC_NAME)
                  .then(function(cache) {
                    if (event.request.headers.get('accept').includes('text/html')) {
                      return cache.match('/offline.html');
                    }
                  })
              });
          }
        })
    );
  }
});

// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.match(event.request)
//       .then(function(response) {
//         if (response) {
//           return response;
//         } else {
//           return fetch(event.request)
//             .then(function(res) {
//               return caches.open(CACHE_DYNAMIC_NAME)
//                 .then(function(cache) {
//                   cache.put(event.request.url, res.clone());
//                   return res;
//                 })
//             })
//             .catch(function(err) {
//               return caches.open(CACHE_STATIC_NAME)
//                 .then(function(cache) {
//                   return cache.match('/offline.html');
//                 })
//             });
//         }
//       })
//   );
// });

/**
 * Cache Strategy: Network with cache fallback
 */
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     fetch(event.request)
//       .then(function (res) {
//         return caches.open(CACHE_DYNAMIC_NAME)
//           .then(function (cache) {
//             cache.put(event.request.url, res.clone());
//             return res;
//           })
//       })
//       .catch(function (err) {
//         return caches.match(event.request);
//       })
//   );
// });

/**
 * Background sync and push notification
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