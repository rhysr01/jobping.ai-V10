/**
 * Web Vitals tracking for Core Web Vitals monitoring
 */

export function reportWebVitals(metric: any) {
	// Send to analytics endpoint in production with mobile context
	if (process.env.NODE_ENV === "production") {
		const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
		const isPoorPerformance = metric.value > (isMobile ? 3000 : 2500); // Mobile has higher tolerance

		fetch("/api/analytics/web-vitals", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-csrf-token": "jobping-request",
			},
			body: JSON.stringify({
				...metric,
				deviceType: isMobile ? 'mobile' : 'desktop',
				isPoorPerformance,
				userAgent: navigator?.userAgent || 'unknown',
			}),
			keepalive: true,
		}).catch(() => {
			// Silently fail if analytics endpoint doesn't exist
		});
	}

	// Enhanced logging in development
	if (process.env.NODE_ENV === "development") {
		const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
		const status = metric.value > (isMobile ? 3000 : 2500) ? '❌ POOR' : '✅ GOOD';
		console.log(`[Web Vitals ${status}]`, metric.name, `${metric.value}ms`, `(${isMobile ? 'mobile' : 'desktop'})`, metric.id);
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
