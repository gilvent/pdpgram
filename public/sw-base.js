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

// use custom handler to store posts to indexed db
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

// display fallback offline.html if failing to get any html file
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

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);