module.exports = {
  "globDirectory": "public/",
  "globPatterns": [
    "**/*.{html,ico,json,css,js}",
    "src/images/*.{png,jpg}"
  ],
  "swSrc": "public/sw-base.js",
  "swDest": "public/service-worker.js",
  "globIgnores": [
    "help/**",
    /**
     * Ignore workbox-sw because it is automatically cached
     * Ref: https://developers.google.com/web/tools/workbox/modules/workbox-sw
     */
    "lib/workbox-v5.1.4" 
  ]
};