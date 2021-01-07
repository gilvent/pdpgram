importScripts('/lib/workbox-v5.1.4/workbox-sw.js');

workbox.setConfig({modulePathPrefix: '/lib/workbox-v5.1.4/'})

workbox.routing.registerRoute(
  new RegExp(/.*(?:googleapis|gstatic)\.com.*$/),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'google-fonts'
  })
)

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST)