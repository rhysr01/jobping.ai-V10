// Performance monitoring utilities
export class PerformanceMonitor {
	private static instance: PerformanceMonitor;
	private readonly metrics: Map<string, number[]> = new Map();
	private readonly maxSamples = 2000;

	static getInstance(): PerformanceMonitor {
		if (!PerformanceMonitor.instance) {
			PerformanceMonitor.instance = new PerformanceMonitor();
		}
		return PerformanceMonitor.instance;
	}

	recordMetric(name: string, value: number): void {
		const bucket = this.metrics.get(name) ?? [];
		bucket.push(value);

		if (bucket.length > this.maxSamples) {
			bucket.splice(0, bucket.length - this.maxSamples);
		}

		this.metrics.set(name, bucket);

		if (name.includes("error") || name.includes("failure")) {
			console.warn(`Performance metric: ${name} = ${value}`);
		}
	}

	getMetricValues(name: string): number[] {
		const values = this.metrics.get(name);
		return values ? [...values] : [];
	}

	getMetricStats(
		name: string,
	): { count: number; avg: number; min: number; max: number } | null {
		const values = this.getMetricValues(name);
		if (values.length === 0) return null;

		return {
			count: values.length,
			avg: values.reduce((a, b) => a + b, 0) / values.length,
			min: Math.min(...values),
			max: Math.max(...values),
		};
	}

	getPercentiles(
		name: string,
		percentiles: number[],
	): Record<string, number> | null {
		const values = this.getMetricValues(name).sort((a, b) => a - b);
		if (values.length === 0) return null;

		const result: Record<string, number> = {};
		percentiles.forEach((p) => {
			const rank = (p / 100) * (values.length - 1);
			const lower = Math.floor(rank);
			const upper = Math.ceil(rank);
			if (lower === upper) {
				result[`p${p}`] = values[lower];
			} else {
				const weight = rank - lower;
				result[`p${p}`] = values[lower] * (1 - weight) + values[upper] * weight;
			}
		});
		return result;
	}

	getHistogram(
		name: string,
		buckets: number[],
	): Array<{ bucket: string; count: number }> {
		const values = this.getMetricValues(name);
		if (values.length === 0) return [];

		const sortedBuckets = [...buckets].sort((a, b) => a - b);
		const counts = new Array(sortedBuckets.length + 1).fill(0);

		values.forEach((value) => {
			let placed = false;
			for (let i = 0; i < sortedBuckets.length; i++) {
				if (value <= sortedBuckets[i]) {
					counts[i] += 1;
					placed = true;
					break;
				}
			}
			if (!placed) {
				counts[counts.length - 1] += 1;
			}
		});

		const histogram: Array<{ bucket: string; count: number }> = [];
		for (let i = 0; i < sortedBuckets.length; i++) {
			const label =
				i === 0
					? `<=${sortedBuckets[i]}`
					: `${sortedBuckets[i - 1] + 1}-${sortedBuckets[i]}`;
			histogram.push({ bucket: label, count: counts[i] });
		}
		histogram.push({
			bucket: `>${sortedBuckets[sortedBuckets.length - 1]}`,
			count: counts[counts.length - 1],
		});

		return histogram;
	}

	getMetricsByPrefix(
		prefix: string,
	): Record<string, { count: number; avg: number; min: number; max: number }> {
		const result: Record<
			string,
			{ count: number; avg: number; min: number; max: number }
		> = {};
		for (const name of this.metrics.keys()) {
			if (name.startsWith(prefix)) {
				const stats = this.getMetricStats(name);
				if (stats) {
					result[name] = stats;
				}
			}
		}
		return result;
	}

	getAllMetrics(): Record<string, any> {
		const result: Record<string, any> = {};
		for (const name of this.metrics.keys()) {
			result[name] = this.getMetricStats(name);
		}
		return result;
	}

	reset(): void {
		this.metrics.clear();
	}
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();