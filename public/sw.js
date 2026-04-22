// self.addEventListener('fetch', (event) => {
//   // If it's a request to your API (different domain),
//   // just let it pass through normally without SW interference.
//   if (event.request.url.includes('app.botconvo.com/')) {
//     return // Do nothing, let the browser handle it
//   }

//   event.respondWith(
//     fetch(event.request).catch((err) => {
//       // This catches local network failures
//       return fetch(event.request)
//     }),
//   )
// })
