import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { ENV } from "../../../lib/env";

// Detect if we're in build time
const isBuildTime =
	process.env.NEXT_PHASE === "phase-production-build" ||
	process.env.NEXT_PHASE === "phase-development-build" ||
	process.env.NEXT_PHASE?.includes("build") ||
	(process.env.VERCEL === "1" && process.env.CI === "1") ||
	process.argv.includes("build") ||
	process.argv.some((arg) => arg.includes("next") && arg.includes("build"));

// Use ENV object for Supabase configuration, with build-time fallbacks
const supabaseUrl = isBuildTime
	? ENV.NEXT_PUBLIC_SUPABASE_URL || "https://build-placeholder.supabase.co"
	: ENV.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = isBuildTime
	? ENV.SUPABASE_SERVICE_ROLE_KEY ||
	  "build-placeholder-service-role-key-minimum-20-chars"
	: ENV.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
	try {
		const startTime = Date.now();

		// Check database connectivity
		const { data: dbHealth, error: dbError } = await supabase
			.from("users")
			.select("count", { count: "exact", head: true });

		const dbResponseTime = Date.now() - startTime;

		// Basic health check with enhanced metrics
		const health = {
			status: dbError ? "degraded" : "healthy",
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			version: "1.0.0",
			services: {
				database: {
					status: dbError ? "error" : "healthy",
					response_time_ms: dbResponseTime,
					user_count: dbHealth ? dbHealth : "unknown",
				},
				api: {
					status: "healthy",
					response_time_ms: Date.now() - startTime,
				},
			},
			environment: ENV.NODE_ENV,
		};

		const statusCode = dbError ? 207 : 200; // 207 = Multi-Status for partial failure

		return NextResponse.json(health, { status: statusCode });
	} catch (error) {
		return NextResponse.json(
			{
				status: "unhealthy",
				timestamp: new Date().toISOString(),
				error: "Health check failed",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 503 },
		);
	}
}

// Handle other methods
export async function POST() {
	return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
	return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
	return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
// Force Vercel redeploy
