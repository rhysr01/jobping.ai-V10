import { NextRequest, NextResponse } from "next/server";

/**
 * Redirects and Path-specific Logic Middleware
 * Handles various redirects and path-based logic
 */
export function handleRedirects(request: NextRequest): NextResponse | null {
	const { pathname } = request.nextUrl;

	// Redirect root to signup
	if (pathname === "/") {
		return NextResponse.redirect(new URL("/signup/free", request.url));
	}

	// Redirect legacy /success to /signup/success
	if (pathname === "/success") {
		return NextResponse.redirect(new URL("/signup/success", request.url));
	}

	// Redirect /signup to /signup/free
	if (pathname === "/signup") {
		return NextResponse.redirect(new URL("/signup/free", request.url));
	}

	// Redirect /matches without auth to signup
	if (pathname === "/matches") {
		const freeUserEmail = request.cookies.get("free_user_email")?.value;
		if (!freeUserEmail) {
			return NextResponse.redirect(new URL("/signup/free", request.url));
		}
	}

	// Redirect /dashboard to /matches for free users
	if (pathname === "/dashboard") {
		const freeUserEmail = request.cookies.get("free_user_email")?.value;
		if (freeUserEmail) {
			return NextResponse.redirect(new URL("/matches", request.url));
		}
		// Premium users can access dashboard, so continue
	}

	return null;
}