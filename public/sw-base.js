importScripts('/lib/workbox-v5.1.4/workbox-sw.js');

workbox.setConfig({modulePathPrefix: '/lib/workbox-v5.1.4/'})

workbox.routing.registerRoute(
  new RegExp(/.*(?:firebasestorage\.googleapis)\.com.*$/),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'post-images'
  })
)

workbox.routing.registerRoute(
  new RegExp(/.*(?:googleapis|gstatic)\.com.*$/),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'google-fonts'
  })
)

workbox.routing.registerRoute(
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'material-css'
  })
)

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST)