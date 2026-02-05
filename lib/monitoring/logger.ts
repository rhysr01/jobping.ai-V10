import { MONITORING_CONFIG } from "./config";

// Enhanced logging system
export enum LogLevel {
	DEBUG = "debug",
	INFO = "info",
	WARN = "warn",
	ERROR = "error",
	CRITICAL = "critical",
}

export interface LogContext {
	userId?: string;
	requestId?: string;
	operation?: string;
	component?: string;
	duration?: number;
	action?: string;
	timestamp?: string;
	metadata?: Record<string, any>;
	error?: Error;
	[key: string]: any; // Allow additional properties
}

export interface LogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	context: LogContext;
	environment: string;
	service: string;
}

class Logger {
	private serviceName = "jobping";

	private shouldLog(level: LogLevel): boolean {
		if (
			process.env.NODE_ENV === "test" &&
			level !== LogLevel.ERROR &&
			level !== LogLevel.CRITICAL
		) {
			return false;
		}

		const configLevel = MONITORING_CONFIG.logging.level;
		const levels = [
			LogLevel.DEBUG,
			LogLevel.INFO,
			LogLevel.WARN,
			LogLevel.ERROR,
			LogLevel.CRITICAL,
		];
		const currentLevelIndex = levels.indexOf(level);
		const configLevelIndex = levels.indexOf(configLevel as LogLevel);

		return currentLevelIndex >= configLevelIndex;
	}

	private sanitizeContext(context: LogContext): LogContext {
		const sanitized: LogContext = {};
		
		for (const [key, value] of Object.entries(context)) {
			if (value instanceof Error) {
				// Serialize Error objects properly
				sanitized[key] = {
					message: value.message,
					stack: value.stack,
					name: value.name,
				};
			} else if (typeof value === "object" && value !== null && "error" in value && value.error instanceof Error) {
				// Handle nested error objects
				sanitized[key] = {
					...value,
					error: {
						message: value.error.message,
						stack: value.error.stack,
						name: value.error.name,
					},
				};
			} else {
				sanitized[key] = value;
			}
		}
		
		return sanitized;
	}

	private formatLog(
		level: LogLevel,
		message: string,
		context: LogContext = {},
	): void {
		if (!this.shouldLog(level)) return;

		const timestamp = new Date().toISOString();
		
		// Sanitize context to prevent Error object serialization issues
		const sanitizedContext = this.sanitizeContext(context);
		
		const logEntry: LogEntry = {
			timestamp,
			level,
			message,
			context: sanitizedContext,
			environment: MONITORING_CONFIG.environment,
			service: this.serviceName,
		};

		if (MONITORING_CONFIG.logging.structured) {
			// Structured JSON logging for production - always log to console for Vercel debugging
			console.log(`[${level.toUpperCase()}] ${message}`, sanitizedContext);
			console.log(JSON.stringify(logEntry));
		} else {
			// Human-readable logging for development
			const emoji = {
				[LogLevel.DEBUG]: "",
				[LogLevel.INFO]: "",
				[LogLevel.WARN]: "",
				[LogLevel.ERROR]: "",
				[LogLevel.CRITICAL]: "",
			}[level];

			const contextStr =
				Object.keys(sanitizedContext).length > 0 ? ` ${JSON.stringify(sanitizedContext)}` : "";

			if (MONITORING_CONFIG.logging.console) {
				console.log(
					`[${timestamp}] ${emoji} ${level.toUpperCase()}: ${message}${contextStr}`,
				);
			}
		}

		// Errors are automatically logged to Axiom via Vercel integration
	}

	debug(message: string, context: LogContext = {}): void {
		this.formatLog(LogLevel.DEBUG, message, context);
	}

	info(message: string, context: LogContext = {}): void {
		this.formatLog(LogLevel.INFO, message, context);
	}

	warn(message: string, context: LogContext = {}): void {
		this.formatLog(LogLevel.WARN, message, context);
	}

	error(message: string, context: LogContext = {}): void {
		this.formatLog(LogLevel.ERROR, message, context);
	}

	critical(message: string, context: LogContext = {}): void {
		this.formatLog(LogLevel.CRITICAL, message, context);
	}

	// Business metrics logging
	metric(
		metricName: string,
		value: number,
		unit: string = "count",
		context: LogContext = {},
	): void {
		this.info(`METRIC: ${metricName}`, {
			...context,
			metadata: {
				...context.metadata,
				metric: {
					name: metricName,
					value,
					unit,
				},
			},
		});

		// Metrics are logged to Axiom via Vercel integration
	}

	// Performance timing
	timer(operation: string, context: LogContext = {}) {
		const startTime = Date.now();

		return {
			end: (additionalContext: LogContext = {}) => {
				const duration = Date.now() - startTime;
				this.info(`TIMING: ${operation}`, {
					...context,
					...additionalContext,
					duration,
					metadata: {
						...context.metadata,
						...additionalContext.metadata,
						timing: {
							operation,
							duration,
							startTime,
							endTime: Date.now(),
						},
					},
				});

				// Timing metrics are logged to Axiom via Vercel integration

				return duration;
			},
		};
	}
}

// Export singleton logger instance
export const logger = new Logger();

/**
 * USER ACTION TRACKING - Simple helper for debugging user flows
 * Usage: logUserAction('signup', { email: user.email, tier: 'free' })
 */
export function logUserAction(
	action: string,
	metadata?: Record<string, any>,
): void {
	logger.info(`USER_ACTION: ${action}`, {
		action,
		timestamp: new Date().toISOString(),
		...metadata,
	});
}
