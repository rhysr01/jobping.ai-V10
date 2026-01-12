import { NextResponse } from "next/server";

/**
 * Security Headers Middleware
 * Adds comprehensive security headers including CSP, HSTS, etc.
 */
export function addSecurityHeaders(response: NextResponse): void {
	// Generate nonce for inline scripts (prevents XSS while allowing necessary inline scripts)
	const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

	// Set nonce in response header for Next.js to use
	response.headers.set("x-nonce", nonce);

	// Enhanced security headers with strict CSP (no unsafe-inline or unsafe-eval)
	// Using nonces for dynamic scripts and hashes for static inline scripts
	// Hash for Google Analytics inline script: kqFzuQJivdoTtSFw6wC6ycybBAlKswA7hJ7PojqXc7Q=
	// Hash for Structured Data JSON-LD: sha256-S/UEtrQCu6TgVoi5WG9EmfntThy9qa0ZZqFKfu1n76w=
	// Hash for FAQ JSON-LD: sha256-K2qBnrJSupBJBzTvPD141bNBx/+m8R4iJQNj2EHmozM=
	// Hash for Organization JSON-LD: sha256-6BVL0DgOeCbtUrFGJAsqrMsuY26fcarXXnMdHEfKW3Y=
	// Hash for Next.js HMR inline script (dev only): sha256-gjKA4KaUqCuh6Z8uiLLjc/ejIMPbHQttPwGl2h8rL9g=
	response.headers.set(
		"Content-Security-Policy",
		"default-src 'self'; " +
			`script-src 'self' 'nonce-${nonce}' 'sha256-kqFzuQJivdoTtSFw6wC6ycybBAlKswA7hJ7PojqXc7Q=' 'sha256-S/UEtrQCu6TgVoi5WG9EmfntThy9qa0ZZqFKfu1n76w=' 'sha256-K2qBnrJSupBJBzTvPD141bNBx/+m8R4iJQNj2EHmozM=' 'sha256-6BVL0DgOeCbtUrFGJAsqrMsuY26fcarXXnMdHEfKW3Y=' 'sha256-gjKA4KaUqCuh6Z8uiLLjc/ejIMPbHQttPwGl2h8rL9g=' https://www.googletagmanager.com https://www.google-analytics.com https://*.supabase.co https://cdn.jsdelivr.net https://*.sentry.io; ` +
			"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com; " +
			"font-src 'self' https://fonts.gstatic.com https://api.fontshare.com https://cdn.fontshare.com; " +
			"img-src 'self' data: https: blob:; " +
			"connect-src 'self' https://*.supabase.co https://api.resend.com https://api.openai.com https://www.google-analytics.com https://www.googletagmanager.com https://*.sentry.io; " +
			"object-src 'none'; " +
			"base-uri 'self'; " +
			"form-action 'self'",
	);

	response.headers.set("X-Frame-Options", "DENY");
	response.headers.set("X-Content-Type-Options", "nosniff");
	response.headers.set("X-XSS-Protection", "1; mode=block");
	response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

	// HSTS header for HTTPS enforcement
	if (process.env.NODE_ENV === "production") {
		response.headers.set(
			"Strict-Transport-Security",
			"max-age=31536000; includeSubDomains; preload",
		);
	}
}

/**
 * Cookie Security Middleware
 * Ensures all cookies have proper security flags
 */
export function secureCookies(response: NextResponse): void {
	const cookieHeader = response.headers.get("Set-Cookie");

	if (cookieHeader) {
		response.headers.set(
			"Set-Cookie",
			cookieHeader
				.split(",")
				.map((cookie) => {
					// Ensure all cookies have SameSite=Lax and Secure flags
					if (!cookie.includes("SameSite")) {
						cookie += "; SameSite=Lax";
					}
					if (
						process.env.NODE_ENV === "production" &&
						!cookie.includes("Secure")
					) {
						cookie += "; Secure";
					}
					return cookie;
				})
				.join(","),
		);
	}
}