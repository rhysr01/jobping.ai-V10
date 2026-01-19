import type { LogContext } from "./logger";

// Context management for request tracking
export class RequestContext {
	private static context: Map<string, LogContext> = new Map();

	static set(requestId: string, context: LogContext): void {
		RequestContext.context.set(requestId, context);
	}

	static get(requestId: string): LogContext | undefined {
		return RequestContext.context.get(requestId);
	}

	static update(requestId: string, updates: Partial<LogContext>): void {
		const existing = RequestContext.context.get(requestId) || {};
		RequestContext.context.set(requestId, { ...existing, ...updates });
	}

	static clear(requestId: string): void {
		RequestContext.context.delete(requestId);
	}

	static cleanup(): void {
		// Clean up old contexts (older than 1 hour)
		const oneHourAgo = Date.now() - 60 * 60 * 1000;
		for (const [requestId, context] of RequestContext.context.entries()) {
			if (
				context.metadata?.timestamp &&
				context.metadata.timestamp < oneHourAgo
			) {
				RequestContext.context.delete(requestId);
			}
		}
	}
}
