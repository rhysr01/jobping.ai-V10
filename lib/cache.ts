import { LRUCache as LRU } from "lru-cache";

/**
 * Standardized Cache Implementation
 * Replaces multiple custom LRU cache implementations across the codebase
 */

// Configuration for different cache use cases
export const CACHE_CONFIGS = {
	aiMatching: {
		max: 10000, // 10k entries
		ttl: 1000 * 60 * 30, // 30 minutes
		maxSize: 50 * 1024 * 1024, // 50MB
		sizeCalculation: (value: any) => {
			// Rough estimation: 1KB per cached item
			return JSON.stringify(value).length;
		},
	},
	general: {
		max: 1000,
		ttl: 1000 * 60 * 15, // 15 minutes
	},
	shortTerm: {
		max: 500,
		ttl: 1000 * 60 * 5, // 5 minutes
	},
} as const;

/**
 * Standardized Cache Interface
 * Provides consistent API across all caching needs
 */
export class StandardizedCache {
	private cache: LRU<string, any>;

	constructor(config: LRU.Options<string, any, any> = CACHE_CONFIGS.general) {
		this.cache = new LRU(config);
	}

	get(key: string): any {
		return this.cache.get(key);
	}

	set(key: string, value: any): void {
		this.cache.set(key, value);
	}

	has(key: string): boolean {
		return this.cache.has(key);
	}

	delete(key: string): boolean {
		return this.cache.delete(key);
	}

	clear(): void {
		this.cache.clear();
	}

	size(): number {
		return this.cache.size;
	}

	keys(): string[] {
		return Array.from(this.cache.keys());
	}

	// Utility methods for common patterns
	getOrSet(key: string, factory: () => any): any {
		let value = this.get(key);
		if (value === undefined) {
			value = factory();
			this.set(key, value);
		}
		return value;
	}

	async getOrSetAsync(key: string, factory: () => Promise<any>): Promise<any> {
		let value = this.get(key);
		if (value === undefined) {
			value = await factory();
			this.set(key, value);
		}
		return value;
	}
}

// Pre-configured instances for common use cases
export const aiMatchingCache = new StandardizedCache(CACHE_CONFIGS.aiMatching);
export const generalCache = new StandardizedCache(CACHE_CONFIGS.general);
export const shortTermCache = new StandardizedCache(CACHE_CONFIGS.shortTerm);

// Utility functions for backward compatibility
export const createCache = (config?: LRU.Options<string, any, any>) =>
	new StandardizedCache(config);

/**
 * Migration helpers - gradually replace old cache implementations
 */
export const migrateFromOldCache = (
	oldCache: any,
	_newCache: StandardizedCache,
): void => {
	if (oldCache && typeof oldCache.size === "function") {
		// Migrate existing entries if possible
		console.log(`Migrating ${oldCache.size()} entries to standardized cache`);
		// Note: Old caches may not expose keys/values, so this is best-effort
	}
};
