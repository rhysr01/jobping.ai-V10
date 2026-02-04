import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
	// Check which environment variables are actually available
	const requiredVars = [
		"NEXT_PUBLIC_SUPABASE_URL",
		"SUPABASE_SERVICE_ROLE_KEY",
		"RESEND_API_KEY",
		"INTERNAL_API_HMAC_SECRET",
		"SYSTEM_API_KEY",
	];

	const envStatus = requiredVars.map((varName) => {
		const value = process.env[varName];
		return {
			name: varName,
			set: !!value,
			length: value?.length || 0,
			preview: value?.substring(0, 20) || "not set",
			// Don't expose full values for security
		};
	});

	const allSet = envStatus.every((v) => v.set);

	// Also check Vercel-specific environment info
	const vercelInfo = {
		VERCEL: process.env.VERCEL,
		VERCEL_ENV: process.env.VERCEL_ENV, // production, preview, development
		VERCEL_URL: process.env.VERCEL_URL,
		NODE_ENV: process.env.NODE_ENV,
	};

	// Count total env vars (for debugging)
	const totalEnvVars = Object.keys(process.env).length;

	return NextResponse.json(
		{
			status: allSet ? "✅ All required variables are set" : "❌ Missing required variables",
			environment: vercelInfo.VERCEL_ENV || "unknown",
			isVercel: vercelInfo.VERCEL === "1",
			totalEnvVars,
			requiredVariables: envStatus,
			vercelInfo,
			troubleshooting: {
				checkEnvironment: `Variables must be set for the "${vercelInfo.VERCEL_ENV || "current"}" environment`,
				checkRedeploy: "If you just added variables, you MUST redeploy for them to take effect",
				checkSpelling: "Variable names are case-sensitive - check for typos",
				checkAllEnvironments: "Make sure variables are set for Production, Preview, AND Development",
			},
		},
		{ status: allSet ? 200 : 500 },
	);
}
