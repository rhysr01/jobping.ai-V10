import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
	return NextResponse.json({ message: "GET works", timestamp: new Date().toISOString() });
}

export async function POST(request: NextRequest) {
	const body = await request.json().catch(() => ({}));
	return NextResponse.json({ 
		message: "POST works", 
		body,
		timestamp: new Date().toISOString() 
	});
}
