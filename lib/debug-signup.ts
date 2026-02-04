/**
 * Enhanced Debug Logging for Free Signup
 * This provides comprehensive logging that works even if Sentry fails
 */

interface SignupDebugLog {
	timestamp: string;
	stage: string;
	requestId?: string;
	data: any;
	error?: {
		message: string;
		stack?: string;
		type?: string;
	};
}

const MAX_LOGS = 100;
const logs: SignupDebugLog[] = [];

export function logSignupEvent(
	stage: string,
	data: any,
	requestId?: string,
	error?: Error,
) {
	const log: SignupDebugLog = {
		timestamp: new Date().toISOString(),
		stage,
		requestId,
		data,
	};

	if (error) {
		log.error = {
			message: error.message,
			stack: error.stack,
			type: error.constructor.name,
		};
	}

	logs.push(log);

	// Keep only last MAX_LOGS entries
	if (logs.length > MAX_LOGS) {
		logs.shift();
	}

	// Always log to console with emoji for visibility
	const emoji = error ? "🚨" : "📝";
	console.log(`${emoji} [SIGNUP DEBUG] ${stage}`, {
		timestamp: log.timestamp,
		requestId,
		data,
		error: error ? { message: error.message, stack: error.stack } : undefined,
	});

	// Also log to window if available (for client-side debugging)
	if (typeof window !== "undefined") {
		(window as any).__signupDebugLogs = logs;
		console.log(
			`[SIGNUP DEBUG] Logs available at window.__signupDebugLogs (${logs.length} entries)`,
		);
	}
}

export function getSignupLogs(): SignupDebugLog[] {
	return [...logs];
}

export function clearSignupLogs() {
	logs.length = 0;
}

export function getRecentErrors(limit: number = 10): SignupDebugLog[] {
	return logs
		.filter((log) => log.error)
		.slice(-limit)
		.reverse();
}
