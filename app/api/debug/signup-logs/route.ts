import { NextRequest, NextResponse } from "next/server";
import { getSignupLogs, getRecentErrors } from "../../../../lib/debug-signup";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	const url = new URL(request.url);
	const errorsOnly = url.searchParams.get("errors") === "true";
	const limit = parseInt(url.searchParams.get("limit") || "50", 10);

	const logs = errorsOnly ? getRecentErrors(limit) : getSignupLogs().slice(-limit);

	return NextResponse.json({
		success: true,
		logs,
		totalLogs: getSignupLogs().length,
		errorsOnly,
		limit,
		timestamp: new Date().toISOString(),
	});
}
