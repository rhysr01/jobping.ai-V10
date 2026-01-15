/**
 * E2E Test Utilities
 * Rate limiting and common test helpers
 */

// Rate limiting configuration - per-test to avoid conflicts
const RATE_LIMIT_DELAY = 500; // 500ms between requests (reduced for parallel tests)

/**
 * Rate-limited request wrapper
 * Adds delays between API calls to prevent rate limiting
 * Uses per-test timing to avoid conflicts in parallel execution
 */
export async function rateLimitedRequest<T>(
	requestFn: () => Promise<T>,
	context?: string
): Promise<T> {
	// Small delay to prevent overwhelming the server
	// Reduced from 1000ms to 500ms and made non-blocking for parallel tests
	const delay = Math.random() * 200 + 100; // Random delay 100-300ms
	await new Promise(resolve => setTimeout(resolve, delay));

	return await requestFn();
}

/**
 * Enhanced request wrapper with retry logic
 */
export async function resilientRequest<T>(
	requestFn: () => Promise<T>,
	maxRetries = 3,
	context?: string
): Promise<T> {
	let lastError: Error;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await rateLimitedRequest(requestFn, `${context} (attempt ${attempt})`);
		} catch (error) {
			lastError = error as Error;
			console.warn(`⚠️ Request failed (attempt ${attempt}/${maxRetries}): ${error.message}`);

			// Don't retry on the last attempt
			if (attempt < maxRetries) {
				const backoffDelay = Math.min(Math.pow(2, attempt) * 500, 3000); // Faster exponential backoff, max 3s
				console.log(`⏳ Retrying in ${backoffDelay}ms...`);
				await new Promise(resolve => setTimeout(resolve, backoffDelay));
			}
		}
	}

	throw lastError!;
}

/**
 * Optimized page wait utilities for faster test execution
 */
export async function waitForPageLoad(page: any) {
	// Wait for network to be idle (faster than waiting for load event)
	await page.waitForLoadState('networkidle', { timeout: 5000 });

	// Quick check for critical elements
	try {
		await page.locator('body').waitFor({ timeout: 2000 });
	} catch (e) {
		// Element not found quickly, continue
	}
}

/**
 * Fast element wait with optimized timeout
 */
export async function fastWaitForSelector(page: any, selector: string, timeout = 3000) {
	return await page.locator(selector).waitFor({ timeout, state: 'visible' });
}