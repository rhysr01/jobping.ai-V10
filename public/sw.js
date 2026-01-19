// Service Worker for JobPing PWA
// Implements basic caching strategy optimized for mobile

const _CACHE_NAME = "jobping-v1.0.0";
const STATIC_CACHE = "jobping-static-v1.0.0";
const API_CACHE = "jobping-api-v1.0.0";

// Resources to cache immediately
const STATIC_ASSETS = [
	"/",
	"/manifest.json",
	"/og-image.png",
	// Critical fonts for offline use
	"https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap",
];

// API endpoints to cache (short-lived)
const API_ENDPOINTS = ["/api/sample-jobs"];

// Install event - cache static assets
self.addEventListener("install", (event) => {
	console.log("[SW] Installing service worker");
	event.waitUntil(
		caches
			.open(STATIC_CACHE)
			.then((cache) => {
				return cache.addAll(STATIC_ASSETS);
			})
			.catch((error) => {
				console.error("[SW] Cache installation failed:", error);
			}),
	);
	// Force activation
	self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
	console.log("[SW] Activating service worker");
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => {
						if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
							console.log("[SW] Deleting old cache:", cacheName);
							return caches.delete(cacheName);
						}
					}),
				);
			})
			.then(() => {
				// Take control of all clients
				return self.clients.claim();
			}),
	);
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Skip non-GET requests and external domains
	if (request.method !== "GET" || !url.origin.includes(self.location.origin)) {
		return;
	}

	// API requests - Network first with cache fallback
	if (API_ENDPOINTS.some((endpoint) => url.pathname.startsWith(endpoint))) {
		event.respondWith(
			fetch(request)
				.then((response) => {
					// Cache successful responses
					if (response.ok) {
						const responseClone = response.clone();
						caches.open(API_CACHE).then((cache) => {
							cache.put(request, responseClone);
						});
					}
					return response;
				})
				.catch(() => {
					// Fallback to cache
					return caches.match(request).then((cachedResponse) => {
						if (cachedResponse) {
							return cachedResponse;
						}
						// Return offline page for API failures
						return new Response(
							JSON.stringify({
								error: "Offline",
								message:
									"You are currently offline. Please check your connection.",
							}),
							{
								status: 503,
								statusText: "Service Unavailable",
								headers: { "Content-Type": "application/json" },
							},
						);
					});
				}),
		);
		return;
	}

	// Static assets - Cache first strategy
	if (
		STATIC_ASSETS.some((asset) => url.pathname === asset || url.href === asset)
	) {
		event.respondWith(
			caches.match(request).then((cachedResponse) => {
				if (cachedResponse) {
					return cachedResponse;
				}
				// Fetch and cache
				return fetch(request).then((response) => {
					const responseClone = response.clone();
					caches.open(STATIC_CACHE).then((cache) => {
						cache.put(request, responseClone);
					});
					return response;
				});
			}),
		);
		return;
	}

	// Default - Network first for HTML pages
	if (request.headers.get("accept")?.includes("text/html")) {
		event.respondWith(
			fetch(request)
				.then((response) => {
					// Don't cache HTML to ensure fresh content
					return response;
				})
				.catch(() => {
					// Return basic offline page
					return new Response(
						`
            <!DOCTYPE html>
            <html>
              <head>
                <title>JobPing - Offline</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: #09090b;
                    color: white;
                    text-align: center;
                    padding: 2rem;
                    margin: 0;
                  }
                  .container {
                    max-width: 400px;
                    margin: 0 auto;
                  }
                  h1 { color: #6d28d9; margin-bottom: 1rem; }
                  p { opacity: 0.8; line-height: 1.6; }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>You're Offline</h1>
                  <p>Please check your internet connection and try again. Your saved preferences will be restored when you're back online.</p>
                </div>
              </body>
            </html>
          `,
						{
							headers: { "Content-Type": "text/html" },
						},
					);
				}),
		);
		return;
	}

	// For other resources, use network first
	event.respondWith(fetch(request));
});

// Background sync for offline actions (if supported)
self.addEventListener("sync", (event) => {
	if (event.tag === "background-sync") {
		console.log("[SW] Background sync triggered");
		// Handle offline actions here when implemented
	}
});

// Push notifications (placeholder for future implementation)
self.addEventListener("push", (event) => {
	if (event.data) {
		const data = event.data.json();
		const options = {
			body: data.body,
			icon: "/og-image.png",
			badge: "/og-image.png",
			vibrate: [100, 50, 100],
			data: data.data,
		};

		event.waitUntil(self.registration.showNotification(data.title, options));
	}
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
	event.notification.close();

	event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
});
