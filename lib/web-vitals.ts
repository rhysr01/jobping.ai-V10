/**
 * Web Vitals tracking for Core Web Vitals monitoring
 */

export function reportWebVitals(metric: any) {
	// Send to analytics endpoint in production with mobile context
	if (process.env.NODE_ENV === "production") {
		const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
		fetch("/api/analytics/web-vitals", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-csrf-token": "jobping-request",
			},
			body: JSON.stringify({
				...metric,
				deviceType: isMobile ? 'mobile' : 'desktop'
			}),
			keepalive: true,
		}).catch(() => {
			// Silently fail if analytics endpoint doesn't exist
		});
	}

	// Log in development
	if (process.env.NODE_ENV === "development") {
		console.log("[Web Vitals]", metric.name, metric.value, metric.id);
	}
}

// Initialize Web Vitals tracking
if (typeof window !== "undefined") {
	// Dynamic import to avoid SSR issues
	import("web-vitals")
		.then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
			onCLS(reportWebVitals);
			onFID(reportWebVitals);
			onFCP(reportWebVitals);
			onLCP(reportWebVitals);
			onTTFB(reportWebVitals);
			onINP(reportWebVitals);
		})
		.catch(() => {
			// Silently fail if web-vitals is not installed
		});
}
