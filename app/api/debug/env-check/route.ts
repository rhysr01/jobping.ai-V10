import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	// Only allow in development or with special header
	const isDev = process.env.NODE_ENV === "development";
	const hasDebugHeader = request.headers.get("x-debug-token") === process.env.SYSTEM_API_KEY;
	
	if (!isDev && !hasDebugHeader) {
		return NextResponse.json({ error: "Not authorized" }, { status: 403 });
	}

	const envCheck = {
		NODE_ENV: process.env.NODE_ENV,
		VERCEL: process.env.VERCEL,
		VERCEL_ENV: process.env.VERCEL_ENV,
		VERCEL_URL: process.env.VERCEL_URL,
		
		// Supabase keys (show presence and length, not actual values)
		NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? {
			present: true,
			length: process.env.NEXT_PUBLIC_SUPABASE_URL.length,
			starts_with: process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 20)
		} : { present: false },
		
		SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? {
			present: true,
			length: process.env.SUPABASE_SERVICE_ROLE_KEY.length,
			starts_with: process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20),
			is_jwt: process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('eyJ')
		} : { present: false },
		
		SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? {
			present: true,
			length: process.env.SUPABASE_ANON_KEY.length,
			starts_with: process.env.SUPABASE_ANON_KEY.substring(0, 20),
			is_jwt: process.env.SUPABASE_ANON_KEY.startsWith('eyJ')
		} : { present: false },
		
		// Other critical keys
		RESEND_API_KEY: process.env.RESEND_API_KEY ? {
			present: true,
			length: process.env.RESEND_API_KEY.length,
			starts_with: process.env.RESEND_API_KEY.substring(0, 10)
		} : { present: false },
		
		INTERNAL_API_HMAC_SECRET: process.env.INTERNAL_API_HMAC_SECRET ? {
			present: true,
			length: process.env.INTERNAL_API_HMAC_SECRET.length
		} : { present: false },
		
		SYSTEM_API_KEY: process.env.SYSTEM_API_KEY ? {
			present: true,
			length: process.env.SYSTEM_API_KEY.length
		} : { present: false },
		
		// Total env vars available
		total_env_vars: Object.keys(process.env).length,
	};

	return NextResponse.json(envCheck);
}