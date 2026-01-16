"use client";

import { useEffect } from "react";
import { useWindowSize } from "./useWindowSize";
import { performanceMonitor } from "../lib/monitoring/performance-monitor";
import { trackEvent } from "../lib/analytics";

export function useMobilePerformance() {
	const { isMobile } = useWindowSize();

	useEffect(() => {
		if (!isMobile) return;

		// Track mobile performance metrics
		const trackMobilePerformance = () => {
			try {
				// Get connection information
				const connection = (navigator as any).connection ||
					(navigator as any).mozConnection ||
					(navigator as any).webkitConnection;

				const connectionType = connection?.effectiveType || 'unknown';
				const deviceMemory = (navigator as any).deviceMemory || 'unknown';

				// Track load time (time since navigation started)
				const loadTime = performance.now();

				// Track performance metrics
				performanceMonitor.recordMetric('mobile_load_time', loadTime);
				performanceMonitor.recordMetric('mobile_connection_type', connectionType === '4g' ? 4 : connectionType === '3g' ? 3 : connectionType === '2g' ? 2 : connectionType === 'slow-2g' ? 1 : 0);

				// Track device memory (if available)
				if (typeof deviceMemory === 'number') {
					performanceMonitor.recordMetric('mobile_device_memory', deviceMemory);
				}

				// Send analytics event
				trackEvent('mobile_performance', {
					loadTime: Math.round(loadTime),
					connectionType,
					deviceMemory,
					userAgent: navigator.userAgent,
					viewport: `${window.innerWidth}x${window.innerHeight}`,
				});

				// Log performance warnings
				if (loadTime > 5000) {
					console.warn(`Slow mobile load: ${loadTime}ms on ${connectionType} connection`);
				}

			} catch (error) {
				console.error('Mobile performance tracking failed:', error);
			}
		};

		// Track immediately when component mounts
		trackMobilePerformance();

		// Also track on visibility change (when user returns to tab)
		const handleVisibilityChange = () => {
			if (!document.hidden) {
				trackMobilePerformance();
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [isMobile]);

	return {
		isMobile,
		getMobileMetrics: () => performanceMonitor.getMetricsByPrefix('mobile_'),
	};
}