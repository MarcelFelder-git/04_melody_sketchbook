// Set a name for the current cache
var cacheName = 'melodysketchbook'; 

// Default files to always cache

var cacheFiles = [
	'./',
	'/manifest.json',
   '/index.html',
   '/favicon.ico',
   '/modules/audio.js',
   '/modules/canvas_handler.js',
   '/modules/db_read.js',
   '/modules/db_save.js',
   '/modules/db.js',
   '/modules/idb-src.min.js',
   '/modules/install.js',
   '/modules/key_detection.js',
   '/modules/lib.js',
   '/modules/main.js',
   '/modules/meyda.js',
   '/modules/scale_select.js',
   '/js/app.js',
   '/css/style.css',
   '/data/db-reader.html',
   '/data/db-saver.html',
   '/data/instruments.json',
   '/data/oscillator.json',
   '/data/piano.json',
   '/data/scales_chroma.json',
   '/data/scales.json',
   '/images/icons/icon-192x192.png',
   '/images/icons/icon-512x512.png',
   '/images/bg_1.png',
   '/images/bg_2.png',
   '/images/bg_img.png',
   '/images/pen_cursor_white.png',
   '/mp3/piano_a3.mp3',
   '/mp3/piano_a4.mp3',
   '/mp3/piano_b3_flat.mp3',
   '/mp3/piano_b3.mp3',
   '/mp3/piano_b4_flat.mp3',
   '/mp3/piano_b4.mp3',
   '/mp3/piano_c3_sharp.mp3',
   '/mp3/piano_c3.mp3',
   '/mp3/piano_c4_sharp.mp3',
   '/mp3/piano_c4.mp3',
   '/mp3/piano_d3_sharp.mp3',
   '/mp3/piano_d3.mp3',
   '/mp3/piano_d4_sharp.mp3',
   '/mp3/piano_d4.mp3',
   '/mp3/piano_e3.mp3',
   '/mp3/piano_e4.mp3',
   '/mp3/piano_f3_sharp.mp3',
   '/mp3/piano_f3.mp3',
   '/mp3/piano_f4_sharp.mp3',
   '/mp3/piano_f4.mp3',
   '/mp3/piano_g3_sharp.mp3',
   '/mp3/piano_g3.mp3',
   '/mp3/piano_g4_sharp.mp3',
   '/mp3/piano_g4.mp3'
];


self.addEventListener('install', function(e) {
    console.log('[ServiceWorker] Installed');

    // e.waitUntil Delays the event until the Promise is resolved
    e.waitUntil(

    	// Open the cache
	    caches.open(cacheName).then(function(cache) {

	    	// Add all the default files to the cache
			console.log('[ServiceWorker] Caching cacheFiles');
			return cache.addAll(cacheFiles);
	    })
	); // end e.waitUntil
});


self.addEventListener('activate', function(e) {
    console.log('[ServiceWorker] Activated');

    e.waitUntil(

    	// Get all the cache keys (cacheName)
		caches.keys().then(function(cacheNames) {
			return Promise.all(cacheNames.map(function(thisCacheName) {

				// If a cached item is saved under a previous cacheName
				if (thisCacheName !== cacheName) {

					// Delete that cached file
					console.log('[ServiceWorker] Removing Cached Files from Cache - ', thisCacheName);
					return caches.delete(thisCacheName);
				}
			}));
		})
	); // end e.waitUntil

});


self.addEventListener('fetch', function(e) {
	console.log('[ServiceWorker] Fetch', e.request.url);

	// e.respondWidth Responds to the fetch event
	e.respondWith(

		// Check in cache for the request being made
		caches.match(e.request)


			.then(function(response) {

				// If the request is in the cache
				if ( response ) {
					console.log("[ServiceWorker] Found in Cache", e.request.url, response);
					// Return the cached version
					return response;
				}

				// If the request is NOT in the cache, fetch and cache

				var requestClone = e.request.clone();
				return fetch(requestClone)
					.then(function(response) {

						if ( !response ) {
							console.log("[ServiceWorker] No response from fetch ")
							return response;
						}

						var responseClone = response.clone();

						//  Open the cache
						caches.open(cacheName).then(function(cache) {

							// Put the fetched response in the cache
							cache.put(e.request, responseClone);
							console.log('[ServiceWorker] New Data Cached', e.request.url);

							// Return the response
							return response;
			
				        }); // end caches.open

					})
					.catch(function(err) {
						console.log('[ServiceWorker] Error Fetching & Caching New Data', err);
					});


			}) // end caches.match(e.request)
	); // end e.respondWith
});
